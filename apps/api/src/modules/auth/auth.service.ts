import crypto from 'node:crypto';
import { promisify } from 'node:util';
import {
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CompanyRole } from '@prisma/client';
import { FastifyReply } from 'fastify';
import nodemailer from 'nodemailer';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthContext, AuthenticatedRequest } from '../../common/auth.types';

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = 'jeh_session';
const SESSION_DAYS = 30;
const VERIFICATION_HOURS = 24;
const LEGAL_VERSION = '2026-09-02';

const normalizeEmail = (email: unknown) =>
  String(email ?? '')
    .trim()
    .toLowerCase();
const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private cookieValue(request: AuthenticatedRequest) {
    const cookies = request.headers.cookie?.split(';') ?? [];
    for (const cookie of cookies) {
      const [key, ...value] = cookie.trim().split('=');
      if (key === SESSION_COOKIE) return decodeURIComponent(value.join('='));
    }
    return null;
  }

  private setSessionCookie(reply: FastifyReply, token: string) {
    (
      reply as FastifyReply & {
        setCookie: (name: string, value: string, options: Record<string, unknown>) => void;
      }
    ).setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: (process.env.APP_URL || '').startsWith('https://'),
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      path: '/',
    });
  }

  private clearSessionCookie(reply: FastifyReply) {
    (
      reply as FastifyReply & {
        clearCookie: (name: string, options: Record<string, unknown>) => void;
      }
    ).clearCookie(SESSION_COOKIE, { path: '/' });
  }

  async context(request: AuthenticatedRequest, reply: FastifyReply): Promise<AuthContext> {
    const token = this.cookieValue(request);
    if (!token) throw new UnauthorizedException('Não autenticado.');
    const session = await this.prisma.client.session.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await this.prisma.client.session.delete({ where: { id: session.id } });
      this.clearSessionCookie(reply);
      throw new UnauthorizedException('Sessão expirada.');
    }
    if (!session.user.emailVerifiedAt) {
      await this.prisma.client.session.deleteMany({ where: { userId: session.userId } });
      this.clearSessionCookie(reply);
      throw new ForbiddenException('Confirme seu e-mail para acessar.');
    }
    const membership = await this.prisma.client.membership.findUnique({
      where: { userId_companyId: { userId: session.userId, companyId: session.activeCompanyId } },
    });
    if (!membership) throw new ForbiddenException('Acesso à empresa removido.');
    return {
      userId: session.userId,
      companyId: membership.companyId,
      role: membership.role,
      name: session.user.name,
      email: session.user.email,
      sessionId: session.id,
    };
  }

  async createSession(reply: FastifyReply, userId: string, companyId: string) {
    const token = randomToken();
    await this.prisma.client.session.create({
      data: {
        tokenHash: tokenHash(token),
        userId,
        activeCompanyId: companyId,
        expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    this.setSessionCookie(reply, token);
  }

  async logout(auth: AuthContext, reply: FastifyReply) {
    await this.prisma.client.session.deleteMany({ where: { id: auth.sessionId } });
    this.clearSessionCookie(reply);
    return { success: true };
  }

  async login(body: Record<string, unknown>, reply: FastifyReply) {
    const email = normalizeEmail(body.email);
    const user = await this.prisma.client.user.findUnique({
      where: { email },
      include: { memberships: true },
    });
    if (!user || !(await verifyPassword(String(body.password ?? ''), user.passwordHash)))
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    if (!user.emailVerifiedAt)
      throw new ForbiddenException(
        'Confirme seu e-mail antes de entrar. Você pode solicitar um novo link abaixo.',
      );
    let membership = user.memberships[0];
    const invitationToken = String(body.invitationToken ?? '');
    if (invitationToken) {
      const invitation = await this.prisma.client.invitation.findUnique({
        where: { tokenHash: tokenHash(invitationToken) },
      });
      if (
        !invitation ||
        invitation.email !== email ||
        invitation.acceptedAt ||
        invitation.expiresAt <= new Date()
      )
        throw new BadRequestException('Convite inválido ou expirado.');
      membership = await this.prisma.client.membership.upsert({
        where: { userId_companyId: { userId: user.id, companyId: invitation.companyId } },
        create: { userId: user.id, companyId: invitation.companyId, role: invitation.role },
        update: {},
      });
      await this.prisma.client.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    }
    if (!membership) throw new ForbiddenException('Usuário sem empresa.');
    await this.createSession(reply, user.id, membership.companyId);
    return { success: true };
  }

  async register(body: Record<string, unknown>) {
    const name = String(body.name ?? '').trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? '');
    const companyName = String(body.companyName ?? '').trim();
    const invitationToken = String(body.invitationToken ?? '');
    if (name.length < 2 || !email.includes('@') || password.length < 8)
      throw new BadRequestException(
        'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.',
      );
    if (body.acceptedTerms !== true || body.acceptedPrivacy !== true)
      throw new BadRequestException(
        'Aceite os Termos de Uso e a Política de Privacidade para continuar.',
      );
    if (await this.prisma.client.user.count({ where: { email } }))
      throw new ConflictException('Este e-mail já possui cadastro.');
    const passwordHash = await hashPassword(password);
    const result = await this.prisma.client.$transaction(async (tx) => {
      const acceptedAt = new Date();
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          termsAcceptedAt: acceptedAt,
          termsVersion: LEGAL_VERSION,
          privacyAcceptedAt: acceptedAt,
          privacyVersion: LEGAL_VERSION,
        },
      });
      let companyId: string;
      let role: CompanyRole = 'owner';
      if (invitationToken) {
        const invitation = await tx.invitation.findUnique({
          where: { tokenHash: tokenHash(invitationToken) },
        });
        if (
          !invitation ||
          invitation.acceptedAt ||
          invitation.expiresAt <= new Date() ||
          invitation.email !== email
        )
          throw new BadRequestException('Convite inválido ou expirado.');
        companyId = invitation.companyId;
        role = invitation.role;
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });
      } else {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(7420190201)::text AS lock_result`;
        const unclaimed = await tx.company.findFirst({
          where: { memberships: { none: {} } },
          orderBy: { createdAt: 'asc' },
        });
        if (unclaimed) companyId = unclaimed.id;
        else {
          if (companyName.length < 2) throw new BadRequestException('Informe o nome da empresa.');
          companyId = (await tx.company.create({ data: { name: companyName } })).id;
        }
      }
      await tx.membership.create({ data: { userId: user.id, companyId, role } });
      return { id: user.id, email: user.email, name: user.name };
    });
    await this.sendVerificationEmail(result);
    return { success: true, message: 'Enviamos um link de confirmação para seu e-mail.' };
  }

  private async sendMail(to: string, subject: string, text: string) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_FROM) {
      if (process.env.NODE_ENV !== 'production') console.log(`[DEV EMAIL] ${to}: ${text}`);
      else throw new Error('SMTP não configurado; e-mail não enviado.');
      return;
    }
    await nodemailer
      .createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: Number(SMTP_PORT) === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
      })
      .sendMail({ from: SMTP_FROM, to, subject, text });
  }

  private async sendVerificationEmail(user: { id: string; email: string; name: string }) {
    await this.prisma.client.emailVerificationToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    const token = randomToken();
    await this.prisma.client.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + VERIFICATION_HOURS * 60 * 60 * 1000),
      },
    });
    const link = `${process.env.APP_URL || 'http://localhost:5173'}/?verify=${encodeURIComponent(token)}`;
    await this.sendMail(
      user.email,
      'Confirme seu e-mail — Confeiti',
      `Olá, ${user.name}! Confirme seu e-mail para acessar o Confeiti. Este link expira em ${VERIFICATION_HOURS} horas: ${link}`,
    );
  }

  async verifyEmail(token: string, reply: FastifyReply) {
    const verification = token
      ? await this.prisma.client.emailVerificationToken.findUnique({
          where: { tokenHash: tokenHash(token) },
          include: { user: { include: { memberships: true } } },
        })
      : null;
    if (!verification || verification.usedAt || verification.expiresAt <= new Date())
      throw new BadRequestException('Link de confirmação inválido ou expirado.');
    const membership = verification.user.memberships[0];
    if (!membership) throw new ForbiddenException('Usuário sem empresa.');
    await this.prisma.client.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationToken.updateMany({
        where: { id: verification.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestException('Link de confirmação já utilizado.');
      await tx.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: new Date() },
      });
      await tx.emailVerificationToken.updateMany({
        where: { userId: verification.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    });
    await this.createSession(reply, verification.userId, membership.companyId);
    return { success: true };
  }

  async resendVerification(emailValue: unknown) {
    const email = normalizeEmail(emailValue);
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt) {
      const latest = await this.prisma.client.emailVerificationToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!latest || latest.createdAt <= new Date(Date.now() - 60000))
        await this.sendVerificationEmail(user);
    }
    return {
      success: true,
      message: 'Se houver uma conta pendente, enviaremos um novo link de confirmação.',
    };
  }

  async me(auth: AuthContext) {
    const companies = await this.prisma.client.membership.findMany({
      where: { userId: auth.userId },
      include: { company: true },
    });
    return {
      user: { id: auth.userId, name: auth.name, email: auth.email },
      activeCompanyId: auth.companyId,
      role: auth.role,
      companies: companies.map(({ company, role }) => ({
        id: company.id,
        name: company.name,
        role,
      })),
    };
  }
  async switchCompany(auth: AuthContext, companyId: string) {
    if (!(await this.prisma.client.membership.count({ where: { userId: auth.userId, companyId } })))
      throw new ForbiddenException('Você não pertence a esta empresa.');
    await this.prisma.client.session.update({
      where: { id: auth.sessionId },
      data: { activeCompanyId: companyId },
    });
    return { success: true };
  }
  async forgotPassword(emailValue: unknown) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: normalizeEmail(emailValue) },
    });
    if (user) {
      await this.prisma.client.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      const token = randomToken();
      await this.prisma.client.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: tokenHash(token),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      const link = `${process.env.APP_URL || 'http://localhost:5173'}/?reset=${encodeURIComponent(token)}`;
      await this.sendMail(
        user.email,
        'Redefina sua senha — Confeiti',
        `Olá, ${user.name}! Use este link para criar uma nova senha. Ele expira em 1 hora: ${link}`,
      );
    }
    return { success: true, message: 'Se o e-mail existir, enviaremos as instruções.' };
  }
  async resetPassword(tokenValue: unknown, password: string) {
    const token = await this.prisma.client.passwordResetToken.findUnique({
      where: { tokenHash: tokenHash(String(tokenValue ?? '')) },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date() || password.length < 8)
      throw new BadRequestException('Link inválido ou expirado.');
    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: token.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      this.prisma.client.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.client.session.deleteMany({ where: { userId: token.userId } }),
    ]);
    return { success: true };
  }
  async members(auth: AuthContext) {
    const members = await this.prisma.client.membership.findMany({
      where: { companyId: auth.companyId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return members.map(({ id, role, user }) => ({
      id,
      role,
      user: { id: user.id, name: user.name, email: user.email },
    }));
  }
  async invite(auth: AuthContext, body: Record<string, unknown>) {
    const email = normalizeEmail(body.email);
    const role = body.role === 'admin' ? 'admin' : 'employee';
    if (!email.includes('@')) throw new BadRequestException('E-mail inválido.');
    const token = randomToken();
    await this.prisma.client.invitation.create({
      data: {
        email,
        role,
        companyId: auth.companyId,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      },
    });
    const link = `${process.env.APP_URL || 'http://localhost:5173'}/?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    await this.sendMail(
      email,
      'Você recebeu um convite — Confeiti',
      `${auth.name} convidou você para fazer parte da equipe no Confeiti. Aceite em até 7 dias: ${link}`,
    );
    return { success: true };
  }
  async changeMember(auth: AuthContext, id: string, roleValue: unknown) {
    const membership = await this.prisma.client.membership.findFirst({
      where: { id, companyId: auth.companyId },
    });
    if (!membership || membership.role === 'owner')
      throw new BadRequestException('Membro inválido.');
    await this.prisma.client.membership.update({
      where: { id },
      data: { role: roleValue === 'admin' ? 'admin' : 'employee' },
    });
    return { success: true };
  }
  async removeMember(auth: AuthContext, id: string) {
    const membership = await this.prisma.client.membership.findFirst({
      where: { id, companyId: auth.companyId },
    });
    if (!membership || membership.role === 'owner' || membership.userId === auth.userId)
      throw new BadRequestException('Membro inválido.');
    await this.prisma.client.membership.delete({ where: { id } });
    await this.prisma.client.session.deleteMany({
      where: { userId: membership.userId, activeCompanyId: auth.companyId },
    });
    return { success: true };
  }
}
