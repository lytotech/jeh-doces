import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { CompanyRole } from '@prisma/client';
import { NextFunction, Request, Response, Router } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from './infrastructure/database';

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = 'jeh_session';
const SESSION_DAYS = 30;
const VERIFICATION_HOURS = 24;
const LEGAL_VERSION = '2026-09-02';

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

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]!));

function emailTemplate(options: { preheader: string; eyebrow: string; title: string; greeting: string; body: string; buttonLabel: string; url: string; expires: string }) {
  const { preheader, eyebrow, title, greeting, body, buttonLabel, url, expires } = options;
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;padding:0;background:#faf7f2;color:#382b20;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f2;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr><td style="padding:0 8px 20px;text-align:center;">
            <div style="display:inline-block;width:52px;height:52px;line-height:52px;border-radius:18px;background:#a86f35;color:#fff;font-size:26px;text-align:center;">🧁</div>
            <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#8d3157;">Confeiti</div>
            <div style="margin-top:3px;font-size:11px;color:#8c7665;letter-spacing:.08em;text-transform:uppercase;">Gestão para confeitaria</div>
          </td></tr>
          <tr><td style="background:#fff;border:1px solid #e8decf;border-radius:24px;padding:36px 32px;box-shadow:0 10px 30px rgba(90,56,32,.08);">
            <div style="font-size:11px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;color:#a86f35;">${escapeHtml(eyebrow)}</div>
            <h1 style="margin:10px 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#3d2a1c;">${escapeHtml(title)}</h1>
            <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#5f4b3c;">${escapeHtml(greeting)}</p>
            <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:#715d4d;">${escapeHtml(body)}</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 26px;"><tr><td style="border-radius:14px;background:#96642f;">
              <a href="${safeUrl}" style="display:inline-block;padding:15px 26px;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;">${escapeHtml(buttonLabel)} →</a>
            </td></tr></table>
            <div style="border-radius:14px;background:#faf7f2;padding:14px 16px;text-align:center;font-size:12px;line-height:1.5;color:#7a6453;">⏱ ${escapeHtml(expires)}</div>
            <p style="margin:24px 0 8px;font-size:11px;line-height:1.5;color:#9a8674;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
            <p style="margin:0;word-break:break-all;font-size:11px;line-height:1.5;color:#96642f;"><a href="${safeUrl}" style="color:#96642f;">${safeUrl}</a></p>
          </td></tr>
          <tr><td style="padding:22px 16px 0;text-align:center;font-size:11px;line-height:1.6;color:#756878;">Esta mensagem foi enviada automaticamente pelo Confeiti.<br>Se você não solicitou esta ação, pode ignorar este e-mail com segurança.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendMail(to: string, subject: string, text: string, html?: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) {
    if (process.env.NODE_ENV !== 'production') console.log(`[DEV EMAIL] ${to}: ${text}`);
    else throw new Error('SMTP não configurado; e-mail não enviado.');
    return;
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  });
  await transport.sendMail({ from: SMTP_FROM, to, subject, text, html });
}

const appUrl = () => process.env.APP_URL || 'http://localhost:5173';
async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const token = randomToken();
  await prisma.emailVerificationToken.create({ data: {
    userId: user.id,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + VERIFICATION_HOURS * 60 * 60 * 1000),
  } });
  const link = `${appUrl()}/?verify=${encodeURIComponent(token)}`;
  await sendMail(user.email, 'Confirme seu e-mail — Confeiti',
    `Olá, ${user.name}! Confirme seu e-mail para acessar o Confeiti. Este link expira em ${VERIFICATION_HOURS} horas: ${link}`,
    emailTemplate({
      preheader: 'Confirme seu e-mail para começar a usar o Confeiti.',
      eyebrow: 'Só falta um passo', title: 'Confirme seu e-mail', greeting: `Olá, ${user.name}!`,
      body: 'Confirme que este endereço pertence a você para liberar seu acesso e proteger os dados da sua empresa.',
      buttonLabel: 'Confirmar meu e-mail', url: link, expires: `Este link expira em ${VERIFICATION_HOURS} horas e só pode ser usado uma vez.`,
    }));
}

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
  if (!session.user.emailVerifiedAt) {
    await prisma.session.deleteMany({ where: { userId: session.userId } });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return res.status(403).json({ error: 'Confirme seu e-mail para acessar.' });
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
  const acceptedTerms = req.body.acceptedTerms === true;
  const acceptedPrivacy = req.body.acceptedPrivacy === true;
  if (name.length < 2 || !email.includes('@') || password.length < 8) return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.' });
  if (!acceptedTerms || !acceptedPrivacy) return res.status(400).json({ error: 'Aceite os Termos de Uso e a Política de Privacidade para continuar.' });
  if (await prisma.user.count({ where: { email } })) return res.status(409).json({ error: 'Este e-mail já possui cadastro.' });
  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const acceptedAt = new Date();
    const user = await tx.user.create({ data: {
      name, email, passwordHash,
      termsAcceptedAt: acceptedAt, termsVersion: LEGAL_VERSION,
      privacyAcceptedAt: acceptedAt, privacyVersion: LEGAL_VERSION,
    } });
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
    return { id: user.id, email: user.email, name: user.name };
  });
  await sendVerificationEmail(result);
  res.status(201).json({ success: true, message: 'Enviamos um link de confirmação para seu e-mail.' });
}));

authRouter.post('/login', asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = await prisma.user.findUnique({ where: { email }, include: { memberships: true } });
  if (!user || !await verifyPassword(String(req.body.password ?? ''), user.passwordHash)) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  if (!user.emailVerifiedAt) return res.status(403).json({ error: 'Confirme seu e-mail antes de entrar. Você pode solicitar um novo link abaixo.' });
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

authRouter.post('/verify-email', asyncRoute(async (req, res) => {
  const rawToken = String(req.body.token ?? '');
  const verification = rawToken
    ? await prisma.emailVerificationToken.findUnique({ where: { tokenHash: tokenHash(rawToken) }, include: { user: { include: { memberships: true } } } })
    : null;
  if (!verification || verification.usedAt || verification.expiresAt <= new Date()) return res.status(400).json({ error: 'Link de confirmação inválido ou expirado.' });
  const membership = verification.user.memberships[0];
  if (!membership) return res.status(403).json({ error: 'Usuário sem empresa.' });
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.emailVerificationToken.updateMany({
      where: { id: verification.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) throw new Error('Link de confirmação já utilizado.');
    await tx.user.update({ where: { id: verification.userId }, data: { emailVerifiedAt: new Date() } });
    await tx.emailVerificationToken.updateMany({
      where: { userId: verification.userId, usedAt: null }, data: { usedAt: new Date() },
    });
  });
  await createSession(res, verification.userId, membership.companyId);
  res.json({ success: true });
}));

authRouter.post('/resend-verification', asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(req.body.email) } });
  if (user && !user.emailVerifiedAt) {
    const latest = await prisma.emailVerificationToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (!latest || latest.createdAt <= new Date(Date.now() - 60 * 1000)) await sendVerificationEmail(user);
  }
  res.json({ success: true, message: 'Se houver uma conta pendente, enviaremos um novo link de confirmação.' });
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
    const link = `${appUrl()}/?reset=${encodeURIComponent(token)}`;
    await sendMail(user.email, 'Redefina sua senha — Confeiti',
      `Olá, ${user.name}! Use este link para criar uma nova senha. Ele expira em 1 hora: ${link}`,
      emailTemplate({
        preheader: 'Use este link seguro para criar uma nova senha.',
        eyebrow: 'Recuperação de acesso', title: 'Crie uma nova senha', greeting: `Olá, ${user.name}!`,
        body: 'Recebemos uma solicitação para redefinir a senha da sua conta. Use o botão abaixo para escolher uma nova senha.',
        buttonLabel: 'Redefinir minha senha', url: link, expires: 'Este link expira em 1 hora e só pode ser usado uma vez.',
      }));
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
  const link = `${appUrl()}/?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await sendMail(email, 'Você recebeu um convite — Confeiti',
    `${req.auth!.name} convidou você para fazer parte da equipe no Confeiti. Aceite em até 7 dias: ${link}`,
    emailTemplate({
      preheader: `${req.auth!.name} convidou você para uma equipe no Confeiti.`,
      eyebrow: 'Convite para a equipe', title: 'Vamos trabalhar juntos?', greeting: 'Olá!',
      body: `${req.auth!.name} convidou você para acessar a empresa no Confeiti e colaborar na gestão de encomendas, receitas e estoque.`,
      buttonLabel: 'Aceitar convite', url: link, expires: 'Este convite expira em 7 dias e é válido somente para este e-mail.',
    }));
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
