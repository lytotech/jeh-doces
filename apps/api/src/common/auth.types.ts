import { CompanyRole } from '@prisma/client';

export interface AuthContext {
  userId: string;
  companyId: string;
  role: CompanyRole;
  name: string;
  email: string;
  sessionId: string;
}

export type AuthenticatedRequest = { auth?: AuthContext; headers: { cookie?: string } };
