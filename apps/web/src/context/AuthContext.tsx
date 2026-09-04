import React, { createContext, useContext, useEffect, useState } from 'react';

export type CompanyRole = 'owner' | 'admin' | 'employee';
export interface AuthState {
  user: { id: string; name: string; email: string };
  activeCompanyId: string;
  role: CompanyRole;
  companies: { id: string; name: string; role: CompanyRole }[];
}

const inFlightAuthRequests = new Map<string, Promise<unknown>>();

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const key = `${method}:${path}:${options?.body || ''}`;
  const existing = inFlightAuthRequests.get(key);
  if (existing) return existing as Promise<T>;

  const pending = authRequestOnce<T>(path, options);
  inFlightAuthRequests.set(key, pending);
  void pending
    .then(
      () => undefined,
      () => undefined,
    )
    .then(() => {
      if (inFlightAuthRequests.get(key) === pending) inFlightAuthRequests.delete(key);
    });
  return pending;
}

async function authRequestOnce<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/auth${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}

interface AuthContextValue {
  auth: AuthState | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, invitationToken?: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    invitationToken?: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
  }) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try {
      setAuth(await authRequest<AuthState>('/me'));
    } catch {
      setAuth(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const login = async (email: string, password: string, invitationToken?: string) => {
    await authRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, invitationToken }),
    });
    await refresh();
  };
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    invitationToken?: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
  }) => {
    return authRequest<{ message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };
  const logout = async () => {
    await authRequest('/logout', { method: 'POST' });
    setAuth(null);
  };
  const switchCompany = async (companyId: string) => {
    await authRequest('/switch-company', { method: 'POST', body: JSON.stringify({ companyId }) });
    window.location.reload();
  };
  return (
    <AuthContext.Provider
      value={{ auth, loading, refresh, login, register, logout, switchCompany }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export { authRequest };
