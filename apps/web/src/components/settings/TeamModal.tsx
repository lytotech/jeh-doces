import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { authRequest, CompanyRole, useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';

interface Member {
  id: string;
  role: CompanyRole;
  user: { id: string; name: string; email: string };
}

export function TeamModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { auth } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [message, setMessage] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const canManage = auth?.role === 'owner' || auth?.role === 'admin';
  const load = () =>
    authRequest<Member[]>('/members')
      .then(setMembers)
      .catch(() => setMembers([]));
  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inviteBusy) return;
    setInviteBusy(true);
    setMessage('');
    try {
      await authRequest('/invitations', { method: 'POST', body: JSON.stringify({ email, role }) });
      setEmail('');
      setMessage('Convite enviado por e-mail.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao convidar.');
    } finally {
      setInviteBusy(false);
    }
  };
  const changeRole = async (member: Member, nextRole: 'admin' | 'employee') => {
    if (memberBusyId) return;
    setMemberBusyId(member.id);
    try {
      await authRequest(`/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      await load();
    } finally {
      setMemberBusyId(null);
    }
  };
  const remove = async (member: Member) => {
    if (!confirm(`Remover ${member.user.name} da empresa?`)) return;
    if (memberBusyId) return;
    setMemberBusyId(member.id);
    try {
      await authRequest(`/members/${member.id}`, { method: 'DELETE' });
      await load();
    } finally {
      setMemberBusyId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Equipe"
      subtitle="Gerencie quem pode acessar os dados da sua empresa"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {canManage && (
          <form
            onSubmit={invite}
            className="rounded-2xl border border-[#EADDE2] bg-[#FFF7FA] p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0CBD6] text-[#6B3157]">
                <UserPlus size={18} />
              </div>
              <div>
                <h4 className="font-bold text-[#63304B]">Convidar funcionário</h4>
                <p className="mt-0.5 text-xs text-[#756878]">
                  Envie um convite para adicionar alguém à equipe.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px]">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviteBusy}
                placeholder="funcionario@email.com"
                aria-label="E-mail do funcionário"
                className="min-w-0 rounded-xl border border-[#E5DACD] bg-white px-3.5 py-2.5 text-sm text-[#2E2A3D] placeholder:text-[#A894A0] focus:border-[#8D3157] focus:outline-none focus:ring-2 focus:ring-[#8D3157]/10"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
                disabled={inviteBusy}
                aria-label="Perfil de acesso"
                className="rounded-xl border border-[#E5DACD] bg-white px-3 py-2.5 text-sm text-[#2E2A3D] focus:border-[#8D3157] focus:outline-none focus:ring-2 focus:ring-[#8D3157]/10"
              >
                <option value="employee">Funcionário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button
              disabled={inviteBusy}
              className="w-full rounded-xl bg-[#8D3157] py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#6B3157] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inviteBusy ? 'Enviando convite…' : 'Enviar convite'}
            </button>
            {message && (
              <p className="rounded-xl bg-white px-3 py-2 text-sm text-[#63304B]">{message}</p>
            )}
          </form>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 font-bold text-[#63304B]">
              <Users size={18} /> Pessoas com acesso
            </h4>
            <span className="rounded-full bg-[#F1E7EC] px-2.5 py-1 text-xs font-semibold text-[#756878]">
              {members.length}
            </span>
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-2xl border border-[#EADDE2] bg-white p-3.5 transition-colors hover:border-[#D69A88]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0E2D1] font-bold text-[#6B3157]">
                  {member.user.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#2E2A3D] truncate">{member.user.name}</p>
                  <p className="text-xs text-[#756878] truncate">{member.user.email}</p>
                </div>
                {member.role === 'owner' ? (
                  <span className="rounded-full bg-[#F7E5EA] px-2.5 py-1 text-xs font-bold text-[#8D3157]">
                    Proprietário
                  </span>
                ) : auth?.role === 'owner' ? (
                  <select
                    value={member.role}
                    disabled={memberBusyId === member.id}
                    onChange={(e) =>
                      void changeRole(member, e.target.value as 'admin' | 'employee')
                    }
                    aria-label={`Perfil de ${member.user.name}`}
                    className="rounded-lg border border-[#E5DACD] bg-white p-1.5 text-xs text-[#63304B]"
                  >
                    <option value="employee">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                ) : (
                  <span className="text-xs text-[#756878]">
                    {member.role === 'admin' ? 'Administrador' : 'Funcionário'}
                  </span>
                )}
                {canManage && member.role !== 'owner' && member.user.id !== auth?.user.id && (
                  <button
                    disabled={memberBusyId === member.id}
                    onClick={() => void remove(member)}
                    aria-label={`Remover ${member.user.name}`}
                    title="Remover acesso"
                    className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
