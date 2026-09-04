import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

/** Single Prisma client shared by the application. */
export const prisma = new PrismaClient();

/** Request-scoped company context used to enforce tenant isolation. */
export const companyContext = new AsyncLocalStorage<string>();

export const runForCompany = <T>(companyId: string, callback: () => T) =>
  companyContext.run(companyId, callback);

export const getCompanyId = () => {
  const companyId = companyContext.getStore();
  if (!companyId) throw new Error('Empresa não definida para esta operação.');
  return companyId;
};
