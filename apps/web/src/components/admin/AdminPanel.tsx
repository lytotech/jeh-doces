import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleOff, LogOut, Plus, ShieldCheck, Users } from 'lucide-react';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api/admin-auth${path}`, { ...options, credentials: 'include', headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}

const date = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Nunca';

export function AdminPanel() {
  const [admin, setAdmin] = useState<{ id: string; name: string; email: string } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const me = await request<{ user: { id: string; name: string; email: string } }>('/me');
      setAdmin(me.user);
      setUsers(await request<AdminUser[]>('/users'));
    } catch (err) {
      setAdmin(null);
      if (err instanceof Error && !err.message.includes('administrador')) setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await request('/login', { method: 'POST', body: JSON.stringify(form) }); setForm({ name: '', email: '', password: '' }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  };

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await request<AdminUser>('/users', { method: 'POST', body: JSON.stringify(form) }); setForm({ name: '', email: '', password: '' }); setShowForm(false); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível criar o administrador.'); }
    finally { setBusy(false); }
  };

  const toggle = async (user: AdminUser) => {
    try { await request(`/users/${user.id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !user.active }) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível atualizar o usuário.'); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF8F2] flex items-center justify-center text-[#8D3157] font-semibold">Carregando painel…</div>;
  if (!admin) return (
    <main className="min-h-screen bg-[#FFF8F2] flex items-center justify-center px-5 py-10">
      <form onSubmit={(event) => void submitLogin(event)} className="w-full max-w-md rounded-[2rem] border border-[#EADDE2] bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7E5EA] text-[#8D3157]"><ShieldCheck size={28} /></div>
        <p className="mt-5 text-center text-xs font-bold uppercase tracking-[.2em] text-[#8D3157]">Confeiti</p>
        <h1 className="mt-2 text-center text-3xl font-bold text-[#2E2A3D]">Área administrativa</h1>
        <p className="mt-2 text-center text-sm text-[#756878]">Acesso exclusivo para administradores da plataforma.</p>
        <div className="mt-7 space-y-4">
          <input required type="email" placeholder="E-mail administrativo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#EADDE2] px-4 py-3 text-sm" />
          <input required type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-[#EADDE2] px-4 py-3 text-sm" />
          {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-[#8D3157] px-4 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Entrando…' : 'Entrar no painel'}</button>
        </div>
      </form>
    </main>
  );

  return <main className="min-h-screen bg-[#FFF8F2] text-[#2E2A3D]">
    <header className="border-b border-[#EADDE2] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#8D3157]">Confeiti</p><h1 className="mt-1 text-2xl font-bold">Painel administrativo</h1></div>
      <div className="flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-sm font-bold">{admin.name}</p><p className="text-xs text-[#756878]">{admin.email}</p></div><button onClick={() => void request('/logout', { method: 'POST', body: '{}' }).then(() => setAdmin(null))} className="rounded-xl p-2 text-[#8D3157] hover:bg-[#F7E5EA]" aria-label="Sair"><LogOut size={19} /></button></div>
    </div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#EADDE2] bg-white p-5"><Users className="text-[#8D3157]" size={20} /><p className="mt-4 text-3xl font-bold">{users.length}</p><p className="text-sm text-[#756878]">Administradores cadastrados</p></div><div className="rounded-2xl border border-[#EADDE2] bg-white p-5"><CheckCircle2 className="text-emerald-600" size={20} /><p className="mt-4 text-3xl font-bold">{users.filter((user) => user.active).length}</p><p className="text-sm text-[#756878]">Acessos ativos</p></div><div className="rounded-2xl border border-[#EADDE2] bg-white p-5"><ShieldCheck className="text-[#8D3157]" size={20} /><p className="mt-4 text-3xl font-bold">Protegido</p><p className="text-sm text-[#756878]">Sessão exclusiva de admin</p></div></div>
      <section className="mt-8 rounded-2xl border border-[#EADDE2] bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EADDE2] p-5"><div><h2 className="text-lg font-bold">Usuários administradores</h2><p className="mt-1 text-sm text-[#756878]">Contas que podem entrar nesta área.</p></div><button onClick={() => { setShowForm(!showForm); setError(''); }} className="inline-flex items-center gap-2 rounded-xl bg-[#8D3157] px-4 py-2.5 text-sm font-bold text-white"><Plus size={17} /> Novo administrador</button></div>
        {showForm && <form onSubmit={(event) => void createUser(event)} className="grid gap-3 border-b border-[#EADDE2] bg-[#FCFAF7] p-5 sm:grid-cols-4"><input required placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-[#EADDE2] px-3 py-2.5 text-sm" /><input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-[#EADDE2] px-3 py-2.5 text-sm" /><input required minLength={8} type="password" placeholder="Senha (mín. 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl border border-[#EADDE2] px-3 py-2.5 text-sm" /><button disabled={busy} className="rounded-xl bg-[#63304B] px-3 py-2.5 text-sm font-bold text-white">Criar conta</button></form>}
        {error && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#FCFAF7] text-xs uppercase tracking-wide text-[#756878]"><tr><th className="px-5 py-4">Administrador</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Último acesso</th><th className="px-5 py-4">Cadastro</th><th className="px-5 py-4 text-right">Ação</th></tr></thead><tbody className="divide-y divide-[#EADDE2]">{users.map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="font-semibold">{user.name}</p><p className="text-xs text-[#756878]">{user.email}</p></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{user.active ? <CheckCircle2 size={13} /> : <CircleOff size={13} />}{user.active ? 'Ativo' : 'Inativo'}</span></td><td className="px-5 py-4 text-[#756878]">{date(user.lastLoginAt)}</td><td className="px-5 py-4 text-[#756878]">{date(user.createdAt)}</td><td className="px-5 py-4 text-right"><button onClick={() => void toggle(user)} className="text-xs font-bold text-[#8D3157] hover:underline">{user.active ? 'Desativar' : 'Ativar'}</button></td></tr>)}</tbody></table></div>
      </section>
    </div>
  </main>;
}
