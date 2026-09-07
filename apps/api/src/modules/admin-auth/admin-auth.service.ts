import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { BadRequestException, Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const scrypt = promisify(crypto.scrypt);
const COOKIE = 'jeh_admin_session';
const DAYS = 7;
const hashToken = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

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
export class AdminAuthService implements OnModuleInit {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const email = normalize(process.env.ADMIN_EMAIL);
    const password = String(process.env.ADMIN_PASSWORD ?? '');
    const name = String(process.env.ADMIN_NAME ?? 'Administrador');
    if (!email || password.length < 8) return;
    if (!(await this.prisma.client.adminUser.count({ where: { email } }))) {
      await this.prisma.client.adminUser.create({ data: { name, email, passwordHash: await hashPassword(password) } });
    }
  }

  private cookie(request: FastifyRequest) {
    const raw = request.headers.cookie?.split(';').find((item) => item.trim().startsWith(`${COOKIE}=`));
    return raw ? decodeURIComponent(raw.trim().slice(COOKIE.length + 1)) : null;
  }

  private setCookie(reply: FastifyReply, token: string) {
    (reply as FastifyReply & { setCookie: Function }).setCookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: (process.env.APP_URL || '').startsWith('https://'),
      maxAge: DAYS * 24 * 60 * 60,
      path: '/',
    });
  }

  private clearCookie(reply: FastifyReply) {
    (reply as FastifyReply & { clearCookie: Function }).clearCookie(COOKIE, { path: '/' });
  }

  async context(request: FastifyRequest, reply: FastifyReply) {
    const token = this.cookie(request);
    if (!token) throw new UnauthorizedException('Faça login como administrador.');
    const session = await this.prisma.client.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { adminUser: true },
    });
    if (!session || session.expiresAt <= new Date() || !session.adminUser.active) {
      if (session) await this.prisma.client.adminSession.delete({ where: { id: session.id } });
      this.clearCookie(reply);
      throw new UnauthorizedException('Sessão administrativa expirada.');
    }
    return { sessionId: session.id, adminUser: session.adminUser };
  }

  async login(body: Record<string, unknown>, reply: FastifyReply) {
    const email = normalize(body.email);
    const admin = await this.prisma.client.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.active || !(await verifyPassword(String(body.password ?? ''), admin.passwordHash)))
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    const token = crypto.randomBytes(32).toString('base64url');
    await this.prisma.client.$transaction([
      this.prisma.client.adminSession.create({ data: { tokenHash: hashToken(token), adminUserId: admin.id, expiresAt: new Date(Date.now() + DAYS * 86400000) } }),
      this.prisma.client.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } }),
    ]);
    this.setCookie(reply, token);
    return { success: true };
  }

  async logout(context: { sessionId: string }, reply: FastifyReply) {
    await this.prisma.client.adminSession.deleteMany({ where: { id: context.sessionId } });
    this.clearCookie(reply);
    return { success: true };
  }

  async me(context: { adminUser: { id: string; name: string; email: string } }) {
    return { user: context.adminUser };
  }

  async users() {
    return this.prisma.client.adminUser.findMany({
      select: { id: true, name: true, email: true, active: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dashboard() {
    const paidCompanyWhere = {
      subscription: { is: { status: 'active' as const, plan: { in: ['monthly', 'annual'] } } },
    };
    const [companies, activeCompanies, users, paidCompanies, paidMemberships, orders, revenue, recentCompanies] =
      await Promise.all([
        this.prisma.client.company.count(),
        this.prisma.client.company.count({ where: { deactivatedAt: null } }),
        this.prisma.client.user.count(),
        this.prisma.client.company.count({ where: paidCompanyWhere }),
        this.prisma.client.membership.findMany({ where: { company: paidCompanyWhere }, select: { userId: true }, distinct: ['userId'] }),
        this.prisma.client.order.count(),
        this.prisma.client.order.aggregate({ _sum: { totalCharged: true } }),
        this.prisma.client.company.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            createdAt: true,
            deactivatedAt: true,
            _count: { select: { memberships: true, orders: true } },
            subscription: { select: { plan: true, status: true } },
          },
        }),
      ]);

    return {
      kpis: {
        companies,
        activeCompanies,
        users,
        paidCompanies,
        paidUsers: paidMemberships.length,
        orders,
        revenue: revenue._sum.totalCharged ?? 0,
      },
      recentCompanies,
    };
  }

  async createUser(body: Record<string, unknown>) {
    const name = String(body.name ?? '').trim();
    const email = normalize(body.email);
    const password = String(body.password ?? '');
    if (name.length < 2 || !email.includes('@') || password.length < 8)
      throw new BadRequestException('Informe nome, e-mail válido e senha com pelo menos 8 caracteres.');
    const exists = await this.prisma.client.adminUser.count({ where: { email } });
    if (exists) throw new BadRequestException('Este e-mail já está cadastrado como administrador.');
    return this.prisma.client.adminUser.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true, active: true, lastLoginAt: true, createdAt: true },
    });
  }

  async toggleUser(id: string, active: boolean) {
    return this.prisma.client.adminUser.update({ where: { id }, data: { active }, select: { id: true, active: true } });
  }
}
