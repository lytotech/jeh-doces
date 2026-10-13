import crypto from 'node:crypto';
import { promisify } from 'node:util';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const scrypt = promisify(crypto.scrypt);
const COOKIE = 'jeh_admin_session';
const DAYS = 7;
const hashToken = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const paidSubscriptionStatuses = new Set<SubscriptionStatus>([
  SubscriptionStatus.active,
  SubscriptionStatus.pending,
  SubscriptionStatus.canceled,
]);

type FinancialPayment = {
  amount: number;
  plan: SubscriptionPlan;
  status: string;
  paidAt: Date | null;
  refundedAt: Date | null;
};

type FinancialSubscription = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  company: { id: string; name: string; deactivatedAt: Date | null };
};

export function buildFinancialDashboard(
  payments: FinancialPayment[],
  subscriptions: FinancialSubscription[],
  prices: { monthly: number; annual: number },
  now = new Date(),
) {
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodStart = new Date(currentMonthStart);
  periodStart.setMonth(periodStart.getMonth() - 11);
  const periodEnd = new Date(currentMonthStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const monthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(periodStart);
    date.setMonth(periodStart.getMonth() + index);
    return { month: monthKey(date), revenue: 0, payments: 0 };
  });
  const monthMap = new Map(months.map((item) => [item.month, item]));
  let receivedRevenue = 0;
  let approvedPayments = 0;

  for (const payment of payments) {
    if (
      payment.status !== 'approved' ||
      !payment.paidAt ||
      payment.refundedAt ||
      payment.paidAt < periodStart ||
      payment.paidAt >= periodEnd
    )
      continue;
    const month = monthMap.get(monthKey(payment.paidAt));
    if (!month) continue;
    month.revenue += payment.amount;
    month.payments += 1;
    receivedRevenue += payment.amount;
    approvedPayments += 1;
  }

  const currentPaidSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.plan !== SubscriptionPlan.basic &&
      paidSubscriptionStatuses.has(subscription.status) &&
      !!subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > now &&
      !subscription.company.deactivatedAt,
  );
  const expiringUntil = new Date(now);
  expiringUntil.setDate(expiringUntil.getDate() + 30);
  const expiringSubscriptions = currentPaidSubscriptions
    .filter(
      (subscription) =>
        !!subscription.currentPeriodEnd && subscription.currentPeriodEnd <= expiringUntil,
    )
    .sort((left, right) => left.currentPeriodEnd!.getTime() - right.currentPeriodEnd!.getTime())
    .slice(0, 8)
    .map((subscription) => ({
      companyId: subscription.company.id,
      companyName: subscription.company.name,
      plan: subscription.plan,
      amount: subscription.plan === SubscriptionPlan.annual ? prices.annual : prices.monthly,
      currentPeriodEnd: subscription.currentPeriodEnd!.toISOString(),
    }));

  return {
    period: { from: periodStart.toISOString(), to: periodEnd.toISOString(), months: 12 },
    summary: {
      receivedRevenue,
      currentMonthRevenue: months[11].revenue,
      approvedPayments,
      paidCompanies: currentPaidSubscriptions.length,
      pendingSubscriptions: subscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.pending,
      ).length,
      overdueSubscriptions: subscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.past_due,
      ).length,
    },
    planDistribution: {
      monthly: currentPaidSubscriptions.filter(
        (subscription) => subscription.plan === SubscriptionPlan.monthly,
      ).length,
      annual: currentPaidSubscriptions.filter(
        (subscription) => subscription.plan === SubscriptionPlan.annual,
      ).length,
    },
    monthlyRevenue: months,
    expiringSubscriptions,
  };
}

export function companyStatusData(body: Record<string, unknown>) {
  if (typeof body.active !== 'boolean')
    throw new BadRequestException('Informe o novo status da empresa.');
  const reason = String(body.reason ?? '').trim();
  if (reason.length < 3 || reason.length > 500)
    throw new BadRequestException('Informe um motivo entre 3 e 500 caracteres.');
  return { active: body.active, reason };
}

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
      await this.prisma.client.adminUser.create({
        data: { name, email, passwordHash: await hashPassword(password) },
      });
    }
  }

  private cookie(request: FastifyRequest) {
    const raw = request.headers.cookie
      ?.split(';')
      .find((item) => item.trim().startsWith(`${COOKIE}=`));
    return raw ? decodeURIComponent(raw.trim().slice(COOKIE.length + 1)) : null;
  }

  private setCookie(reply: FastifyReply, token: string) {
    (
      reply as FastifyReply & {
        setCookie: (name: string, value: string, options: Record<string, unknown>) => void;
      }
    ).setCookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: (process.env.APP_URL || '').startsWith('https://'),
      maxAge: DAYS * 24 * 60 * 60,
      path: '/',
    });
  }

  private clearCookie(reply: FastifyReply) {
    (
      reply as FastifyReply & {
        clearCookie: (name: string, options: Record<string, unknown>) => void;
      }
    ).clearCookie(COOKIE, { path: '/' });
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
    if (
      !admin ||
      !admin.active ||
      !(await verifyPassword(String(body.password ?? ''), admin.passwordHash))
    )
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    const token = crypto.randomBytes(32).toString('base64url');
    await this.prisma.client.$transaction([
      this.prisma.client.adminSession.create({
        data: {
          tokenHash: hashToken(token),
          adminUserId: admin.id,
          expiresAt: new Date(Date.now() + DAYS * 86400000),
        },
      }),
      this.prisma.client.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      }),
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
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dashboard() {
    const paidPlans: SubscriptionPlan[] = [SubscriptionPlan.monthly, SubscriptionPlan.annual];
    const paidCompanyWhere = {
      subscription: { is: { status: SubscriptionStatus.active, plan: { in: paidPlans } } },
    };
    const [
      companies,
      activeCompanies,
      users,
      paidCompanies,
      paidMemberships,
      orders,
      revenue,
      recentCompanies,
    ] = await Promise.all([
      this.prisma.client.company.count(),
      this.prisma.client.company.count({ where: { deactivatedAt: null } }),
      this.prisma.client.user.count(),
      this.prisma.client.company.count({ where: paidCompanyWhere }),
      this.prisma.client.membership.findMany({
        where: { company: paidCompanyWhere },
        select: { userId: true },
        distinct: ['userId'],
      }),
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

  async financialDashboard() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodStart.setMonth(periodStart.getMonth() - 11);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const paidPlans: SubscriptionPlan[] = [SubscriptionPlan.monthly, SubscriptionPlan.annual];
    const [payments, subscriptions, prices] = await Promise.all([
      this.prisma.client.subscriptionPayment.findMany({
        where: { paidAt: { gte: periodStart, lt: periodEnd } },
        select: { amount: true, plan: true, status: true, paidAt: true, refundedAt: true },
      }),
      this.prisma.client.subscription.findMany({
        where: { plan: { in: paidPlans } },
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
          company: { select: { id: true, name: true, deactivatedAt: true } },
        },
      }),
      this.prisma.client.billingPrice.upsert({
        where: { id: 'default' },
        update: {},
        create: { id: 'default', monthly: 19.8, annual: 179.8 },
        select: { monthly: true, annual: true },
      }),
    ]);
    return buildFinancialDashboard(payments, subscriptions, prices, now);
  }

  async companies(query: Record<string, unknown>) {
    const search = String(query.q ?? '').trim();
    const status = String(query.status ?? 'all');
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(10, Number(query.pageSize) || 10));
    const where: Prisma.CompanyWhereInput = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (status === 'active') where.deactivatedAt = null;
    if (status === 'inactive') where.deactivatedAt = { not: null };

    const companies = await this.prisma.client.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        deactivatedAt: true,
        memberships: {
          select: {
            user: {
              select: {
                sessions: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
              },
            },
          },
        },
        _count: { select: { memberships: true, orders: true, products: true, customers: true } },
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
      },
    });

    const rows = companies.map(({ memberships, ...company }) => ({
      ...company,
      lastAccessAt: memberships.reduce<Date | null>((latest, membership) => {
        const value = membership.user.sessions[0]?.createdAt ?? null;
        return value && (!latest || value > latest) ? value : latest;
      }, null),
    }));
    const sort = String(query.sort ?? 'createdAt');
    rows.sort((left, right) => {
      if (sort === 'name') return left.name.localeCompare(right.name, 'pt-BR');
      if (sort === 'lastAccess') {
        return (right.lastAccessAt?.getTime() ?? 0) - (left.lastAccessAt?.getTime() ?? 0);
      }
      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    const total = rows.length;
    const active = rows.filter((company) => !company.deactivatedAt).length;
    const inactive = total - active;
    const start = (page - 1) * pageSize;
    return {
      companies: rows.slice(start, start + pageSize),
      pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
      summary: { total, active, inactive },
    };
  }

  async company(id: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        deactivatedAt: true,
        deletionRequestedAt: true,
        deletionScheduledFor: true,
        memberships: {
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                sessions: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            products: true,
            customers: true,
            ingredients: true,
            materials: true,
          },
        },
        subscription: {
          select: { plan: true, status: true, currentPeriodEnd: true, createdAt: true },
        },
      },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada.');
    return {
      ...company,
      memberships: company.memberships.map(({ user, ...membership }) => ({
        ...membership,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          lastAccessAt: user.sessions[0]?.createdAt ?? null,
        },
      })),
    };
  }

  async companyAudit(id: string) {
    const exists = await this.prisma.client.company.count({ where: { id } });
    if (!exists) throw new NotFoundException('Empresa não encontrada.');
    return this.prisma.client.adminAuditLog.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        reason: true,
        createdAt: true,
        adminUser: { select: { name: true, email: true } },
      },
    });
  }

  async updateCompanyStatus(
    id: string,
    body: Record<string, unknown>,
    context: { adminUser: { id: string } },
  ) {
    const { active, reason } = companyStatusData(body);
    const company = await this.prisma.client.company.findUnique({
      where: { id },
      select: { id: true, deactivatedAt: true },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada.');
    const action = active ? 'company_reactivated' : 'company_deactivated';
    const updated = await this.prisma.client.$transaction(async (transaction) => {
      const result = await transaction.company.update({
        where: { id },
        data: { deactivatedAt: active ? null : new Date() },
        select: { id: true, name: true, deactivatedAt: true },
      });
      await transaction.adminAuditLog.create({
        data: { adminUserId: context.adminUser.id, companyId: id, action, reason },
      });
      return result;
    });
    return { ...updated, active: !updated.deactivatedAt };
  }

  async pricing() {
    const prices = await this.prisma.client.billingPrice.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', monthly: 19.8, annual: 179.8 },
    });
    return { monthly: prices.monthly, annual: prices.annual };
  }

  async updatePricing(body: Record<string, unknown>) {
    const monthly = Number(body.monthly);
    const annual = Number(body.annual);
    if (![monthly, annual].every((value) => Number.isFinite(value) && value > 0 && value <= 100000))
      throw new BadRequestException('Informe valores positivos para os dois planos.');
    const prices = await this.prisma.client.billingPrice.upsert({
      where: { id: 'default' },
      update: { monthly, annual },
      create: { id: 'default', monthly, annual },
    });
    return { monthly: prices.monthly, annual: prices.annual };
  }

  async createUser(body: Record<string, unknown>) {
    const name = String(body.name ?? '').trim();
    const email = normalize(body.email);
    const password = String(body.password ?? '');
    if (name.length < 2 || !email.includes('@') || password.length < 8)
      throw new BadRequestException(
        'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.',
      );
    const exists = await this.prisma.client.adminUser.count({ where: { email } });
    if (exists) throw new BadRequestException('Este e-mail já está cadastrado como administrador.');
    return this.prisma.client.adminUser.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  async toggleUser(id: string, active: boolean) {
    return this.prisma.client.adminUser.update({
      where: { id },
      data: { active },
      select: { id: true, active: true },
    });
  }
}
