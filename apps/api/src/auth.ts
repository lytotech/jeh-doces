import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { CompanyRole } from '@prisma/client';
import { NextFunction, Request, Response, Router } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from './db';

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = 'jeh_session';
const SESSION_DAYS = 30;

export interface AuthContext {
  userId: string;
  companyId: string;
  role: CompanyRole;
  name: string;
  email: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request { auth?: AuthContext }
  }
}

const normalizeEmail = (email: unknown) => String(email ?? '').trim().toLowerCase();
const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}

function cookieValue(req: Request, name: string) {
  const cookies = req.headers.cookie?.split(';') ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

function sessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: appUrl().startsWith('https://'),
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

async function createSession(res: Response, userId: string, companyId: string) {
  const token = randomToken();
  await prisma.session.create({ data: {
    tokenHash: tokenHash(token), userId, activeCompanyId: companyId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  } });
  sessionCookie(res, token);
}

async function sendMail(to: string, subject: string, text: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) {
    if (process.env.NODE_ENV !== 'production') console.log(`[DEV EMAIL] ${to}: ${text}`);
    else console.error('SMTP não configurado; e-mail não enviado.');
    return;
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  });
  await transport.sendMail({ from: SMTP_FROM, to, subject, text });
}

const appUrl = () => process.env.APP_URL || 'http://localhost:5173';
const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => void handler(req, res, next).catch(next);

export const requireAuth = asyncRoute(async (req, res, next) => {
  const token = cookieValue(req, SESSION_COOKIE);
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return res.status(401).json({ error: 'Sessão expirada.' });
  }
  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: session.userId, companyId: session.activeCompanyId } },
  });
  if (!membership) return res.status(403).json({ error: 'Acesso à empresa removido.' });
  req.auth = { userId: session.userId, companyId: membership.companyId, role: membership.role, name: session.user.name, email: session.user.email, sessionId: session.id };
  next();
});

export const requireRole = (...roles: CompanyRole[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth || !roles.includes(req.auth.role)) return res.status(403).json({ error: 'Permissão insuficiente.' });
  next();
};

export const authRouter = Router();

authRouter.post('/register', asyncRoute(async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password ?? '');
  const companyName = String(req.body.companyName ?? '').trim();
  const invitationToken = String(req.body.invitationToken ?? '');
  if (name.length < 2 || !email.includes('@') || password.length < 8) return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.' });
  if (await prisma.user.count({ where: { email } })) return res.status(409).json({ error: 'Este e-mail já possui cadastro.' });
  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, passwordHash } });
    let companyId: string;
    let role: CompanyRole = 'owner';
    if (invitationToken) {
      const invitation = await tx.invitation.findUnique({ where: { tokenHash: tokenHash(invitationToken) } });
      if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date() || invitation.email !== email) throw new Error('Convite inválido ou expirado.');
      companyId = invitation.companyId;
      role = invitation.role;
      await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    } else {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(7420190201)::text AS lock_result`;
      const unclaimed = await tx.company.findFirst({ where: { memberships: { none: {} } }, orderBy: { createdAt: 'asc' } });
      if (unclaimed) companyId = unclaimed.id;
      else {
        if (companyName.length < 2) throw new Error('Informe o nome da empresa.');
        companyId = (await tx.company.create({ data: { name: companyName } })).id;
      }
    }
    await tx.membership.create({ data: { userId: user.id, companyId, role } });
    return { userId: user.id, companyId };
  });
  await createSession(res, result.userId, result.companyId);
  res.status(201).json({ success: true });
}));

authRouter.post('/login', asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = await prisma.user.findUnique({ where: { email }, include: { memberships: true } });
  if (!user || !await verifyPassword(String(req.body.password ?? ''), user.passwordHash)) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  let membership = user.memberships[0];
  const invitationToken = String(req.body.invitationToken ?? '');
  if (invitationToken) {
    const invitation = await prisma.invitation.findUnique({ where: { tokenHash: tokenHash(invitationToken) } });
    if (!invitation || invitation.email !== email || invitation.acceptedAt || invitation.expiresAt <= new Date()) return res.status(400).json({ error: 'Convite inválido ou expirado.' });
    membership = await prisma.membership.upsert({
      where: { userId_companyId: { userId: user.id, companyId: invitation.companyId } },
      create: { userId: user.id, companyId: invitation.companyId, role: invitation.role }, update: {},
    });
    await prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
  }
  if (!membership) return res.status(403).json({ error: 'Usuário sem empresa.' });
  await createSession(res, user.id, membership.companyId);
  res.json({ success: true });
}));

authRouter.post('/logout', requireAuth, asyncRoute(async (req, res) => {
  await prisma.session.deleteMany({ where: { id: req.auth!.sessionId } });
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ success: true });
}));

authRouter.get('/me', requireAuth, asyncRoute(async (req, res) => {
  const companies = await prisma.membership.findMany({ where: { userId: req.auth!.userId }, include: { company: true } });
  res.json({ user: { id: req.auth!.userId, name: req.auth!.name, email: req.auth!.email }, activeCompanyId: req.auth!.companyId, role: req.auth!.role,
    companies: companies.map(({ company, role }) => ({ id: company.id, name: company.name, role })) });
}));

authRouter.post('/switch-company', requireAuth, asyncRoute(async (req, res) => {
  const companyId = String(req.body.companyId ?? '');
  if (!await prisma.membership.count({ where: { userId: req.auth!.userId, companyId } })) return res.status(403).json({ error: 'Você não pertence a esta empresa.' });
  await prisma.session.update({ where: { id: req.auth!.sessionId }, data: { activeCompanyId: companyId } });
  res.json({ success: true });
}));

authRouter.post('/forgot-password', asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(req.body.email) } });
  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    const token = randomToken();
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await sendMail(user.email, 'Recuperação de senha — Jeh Doces', `Use este link em até 1 hora: ${appUrl()}/?reset=${encodeURIComponent(token)}`);
  }
  res.json({ success: true, message: 'Se o e-mail existir, enviaremos as instruções.' });
}));

authRouter.post('/reset-password', asyncRoute(async (req, res) => {
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: tokenHash(String(req.body.token ?? '')) } });
  const password = String(req.body.password ?? '');
  if (!token || token.usedAt || token.expiresAt <= new Date() || password.length < 8) return res.status(400).json({ error: 'Link inválido ou expirado.' });
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: token.userId } }),
  ]);
  res.json({ success: true });
}));

authRouter.get('/members', requireAuth, asyncRoute(async (req, res) => {
  const members = await prisma.membership.findMany({ where: { companyId: req.auth!.companyId }, include: { user: true }, orderBy: { createdAt: 'asc' } });
  res.json(members.map(({ id, role, user }) => ({ id, role, user: { id: user.id, name: user.name, email: user.email } })));
}));

authRouter.post('/invitations', requireAuth, requireRole('owner', 'admin'), asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const role = req.body.role === 'admin' ? 'admin' : 'employee';
  if (!email.includes('@')) return res.status(400).json({ error: 'E-mail inválido.' });
  const token = randomToken();
  await prisma.invitation.create({ data: { email, role, companyId: req.auth!.companyId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  await sendMail(email, 'Convite para o Jeh Doces', `${req.auth!.name} convidou você. Aceite em até 7 dias: ${appUrl()}/?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
  res.status(201).json({ success: true });
}));

authRouter.patch('/members/:id', requireAuth, requireRole('owner'), asyncRoute(async (req, res) => {
  const membership = await prisma.membership.findFirst({ where: { id: String(req.params.id), companyId: req.auth!.companyId } });
  if (!membership || membership.role === 'owner') return res.status(400).json({ error: 'Membro inválido.' });
  const role = req.body.role === 'admin' ? 'admin' : 'employee';
  await prisma.membership.update({ where: { id: membership.id }, data: { role } });
  res.json({ success: true });
}));

authRouter.delete('/members/:id', requireAuth, requireRole('owner', 'admin'), asyncRoute(async (req, res) => {
  const membership = await prisma.membership.findFirst({ where: { id: String(req.params.id), companyId: req.auth!.companyId } });
  if (!membership || membership.role === 'owner' || membership.userId === req.auth!.userId) return res.status(400).json({ error: 'Membro inválido.' });
  await prisma.membership.delete({ where: { id: membership.id } });
  await prisma.session.deleteMany({ where: { userId: membership.userId, activeCompanyId: req.auth!.companyId } });
  res.json({ success: true });
}));
