import React, { useEffect, useState } from 'react';
import { Ban, CheckCircle2, ChevronLeft, ChevronRight, Eye, Search, X } from 'lucide-react';

type CompanyRow = {
  id: string;
  name: string;
  createdAt: string;
  deactivatedAt: string | null;
  lastAccessAt: string | null;
  _count: { memberships: number; orders: number; products: number; customers: number };
  subscription: { plan: string; status: string; currentPeriodEnd: string | null } | null;
};

type CompanyDetails = CompanyRow & {
  updatedAt: string;
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
  memberships: {
    role: string;
    createdAt: string;
    user: { id: string; name: string; email: string; lastAccessAt: string | null };
  }[];
  _count: CompanyRow['_count'] & { ingredients: number; materials: number };
};

type AuditEntry = {
  id: string;
  action: string;
  reason: string;
  createdAt: string;
  adminUser: { name: string; email: string };
};

type CompanyResponse = {
  companies: CompanyRow[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
  summary: { total: number; active: number; inactive: number };
};

const request = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`/api/admin-auth${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
};

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : 'Nunca';

const planLabel = (plan: string | undefined) =>
  plan === 'monthly' ? 'Mensal' : plan === 'annual' ? 'Anual' : 'Básico';

export function AdminCompanies() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [selected, setSelected] = useState<CompanyDetails | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [action, setAction] = useState<'block' | 'reactivate' | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        status,
        sort,
        page: String(page),
        pageSize: '10',
      });
      setData(await request<CompanyResponse>(`/companies?${params}`));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [query, status, sort, page]);

  const openDetails = async (id: string) => {
    try {
      const [details, history] = await Promise.all([
        request<CompanyDetails>(`/companies/${id}`),
        request<AuditEntry[]>(`/companies/${id}/audit`),
      ]);
      setSelected(details);
      setAudit(history);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os detalhes.');
    }
  };

  const updateStatus = async () => {
    if (!selected || !action || reason.trim().length < 3) return;
    try {
      await request(`/companies/${selected.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: action === 'reactivate', reason: reason.trim() }),
      });
      await openDetails(selected.id);
      await load();
      setAction(null);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar o status.');
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#EADDE2] bg-white shadow-sm">
      <div className="border-b border-[#EADDE2] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Gestão de empresas</h2>
            <p className="mt-1 text-sm text-[#756878]">
              Acompanhe atividade, retenção e situação das contas.
            </p>
          </div>
          <div className="flex gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#F7E5EA] px-3 py-1.5 text-[#8D3157]">
              {data?.summary.total ?? 0} empresas
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
              {data?.summary.active ?? 0} ativas
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
              {data?.summary.inactive ?? 0} bloqueadas
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <label className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-3 text-[#9B8992]" size={17} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar empresa..."
              className="w-full rounded-xl border border-[#EADDE2] py-2.5 pl-10 pr-3 text-sm"
            />
          </label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#EADDE2] px-3 py-2.5 text-sm"
          >
            <option value="all">Todas</option>
            <option value="active">Ativas</option>
            <option value="inactive">Bloqueadas</option>
          </select>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#EADDE2] px-3 py-2.5 text-sm"
          >
            <option value="createdAt">Mais recentes</option>
            <option value="name">Nome</option>
            <option value="lastAccess">Último acesso</option>
          </select>
        </div>
      </div>
      {error && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#FCFAF7] text-xs uppercase tracking-wide text-[#756878]">
            <tr>
              <th className="px-5 py-4">Empresa</th>
              <th className="px-5 py-4">Plano</th>
              <th className="px-5 py-4">Atividade</th>
              <th className="px-5 py-4">Uso</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EADDE2]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[#756878]">
                  Carregando empresas…
                </td>
              </tr>
            ) : data?.companies.length ? (
              data.companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-xs text-[#756878]">Cadastro: {date(company.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4 text-[#756878]">
                    {planLabel(company.subscription?.plan)}
                  </td>
                  <td className="px-5 py-4 text-[#756878]">{date(company.lastAccessAt)}</td>
                  <td className="px-5 py-4 text-xs text-[#756878]">
                    {company._count.orders} pedidos · {company._count.memberships} usuários
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${company.deactivatedAt ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}
                    >
                      {company.deactivatedAt ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                      {company.deactivatedAt ? 'Bloqueada' : 'Ativa'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => void openDetails(company.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8D3157] hover:underline"
                    >
                      <Eye size={14} /> Detalhes
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[#756878]">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-[#EADDE2] px-5 py-4 text-sm text-[#756878]">
          <span>
            Mostrando página {data.pagination.page} de {data.pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-[#EADDE2] p-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= data.pagination.pages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-[#EADDE2] p-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#EADDE2] p-5">
              <div>
                <h3 className="text-xl font-bold">{selected.name}</h3>
                <p className="mt-1 text-sm text-[#756878]">Cadastro: {date(selected.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Fechar"
                className="rounded-lg p-2 text-[#756878] hover:bg-[#F7E5EA]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div className="rounded-xl bg-[#FCFAF7] p-4">
                <p className="text-xs text-[#756878]">Plano</p>
                <p className="mt-1 font-bold">{planLabel(selected.subscription?.plan)}</p>
              </div>
              <div className="rounded-xl bg-[#FCFAF7] p-4">
                <p className="text-xs text-[#756878]">Pedidos</p>
                <p className="mt-1 font-bold">{selected._count.orders}</p>
              </div>
              <div className="rounded-xl bg-[#FCFAF7] p-4">
                <p className="text-xs text-[#756878]">Último acesso</p>
                <p className="mt-1 font-bold">
                  {date(
                    selected.memberships.reduce<string | null>(
                      (latest, item) =>
                        item.user.lastAccessAt && (!latest || item.user.lastAccessAt > latest)
                          ? item.user.lastAccessAt
                          : latest,
                      null,
                    ),
                  )}
                </p>
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Usuários</h4>
                <span className="text-sm text-[#756878]">{selected.memberships.length}</span>
              </div>
              <div className="mt-3 divide-y divide-[#EADDE2] rounded-xl border border-[#EADDE2]">
                {selected.memberships.map((membership) => (
                  <div
                    key={membership.user.id}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{membership.user.name}</p>
                      <p className="text-xs text-[#756878]">{membership.user.email}</p>
                    </div>
                    <span className="text-xs capitalize text-[#756878]">{membership.role}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {selected.deactivatedAt ? (
                  <button
                    onClick={() => setAction('reactivate')}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Reativar empresa
                  </button>
                ) : (
                  <button
                    onClick={() => setAction('block')}
                    className="rounded-xl bg-[#8D3157] px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Bloquear empresa
                  </button>
                )}
              </div>
              <h4 className="mt-6 font-bold">Histórico administrativo</h4>
              <div className="mt-3 space-y-3">
                {audit.length ? (
                  audit.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-[#EADDE2] p-3 text-sm">
                      <p className="font-semibold">
                        {entry.action === 'company_deactivated'
                          ? 'Empresa bloqueada'
                          : 'Empresa reativada'}
                      </p>
                      <p className="mt-1 text-[#756878]">{entry.reason}</p>
                      <p className="mt-1 text-xs text-[#9B8992]">
                        {entry.adminUser.name} · {date(entry.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#756878]">Nenhuma ação registrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {selected && action && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold">
              {action === 'block' ? 'Bloquear empresa' : 'Reativar empresa'}
            </h3>
            <p className="mt-1 text-sm text-[#756878]">
              Informe o motivo para registrar na auditoria.
            </p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo"
              rows={4}
              className="mt-4 w-full rounded-xl border border-[#EADDE2] p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setAction(null);
                  setReason('');
                }}
                className="rounded-xl border border-[#EADDE2] px-4 py-2.5 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                disabled={reason.trim().length < 3}
                onClick={() => void updateStatus()}
                className="rounded-xl bg-[#8D3157] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
