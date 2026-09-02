import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { authRequest, CompanyRole, useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';

interface Member { id: string; role: CompanyRole; user: { id: string; name: string; email: string } }

export function TeamModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { auth } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [message, setMessage] = useState('');
  const canManage = auth?.role === 'owner' || auth?.role === 'admin';
  const load = () => authRequest<Member[]>('/members').then(setMembers).catch(() => setMembers([]));
  useEffect(() => { if (isOpen) void load(); }, [isOpen]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('');
    try {
      await authRequest('/invitations', { method: 'POST', body: JSON.stringify({ email, role }) });
      setEmail(''); setMessage('Convite enviado por e-mail.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erro ao convidar.'); }
  };
  const changeRole = async (member: Member, nextRole: 'admin' | 'employee') => {
    await authRequest(`/members/${member.id}`, { method: 'PATCH', body: JSON.stringify({ role: nextRole }) });
    await load();
  };
  const remove = async (member: Member) => {
    if (!confirm(`Remover ${member.user.name} da empresa?`)) return;
    await authRequest(`/members/${member.id}`, { method: 'DELETE' }); await load();
  };

  return <Modal isOpen={isOpen} onClose={onClose} title="Equipe" subtitle="Funcionários com acesso aos dados desta empresa" maxWidth="md">
    <div className="space-y-5">
      {canManage && <form onSubmit={invite} className="rounded-2xl bg-[#FAF5EE] p-4 space-y-3">
        <h4 className="font-bold text-[#5C4533] flex items-center gap-2"><UserPlus size={18}/> Convidar funcionário</h4>
        <div className="flex gap-2"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="funcionario@email.com" className="min-w-0 flex-1 rounded-xl border border-[#E5DACD] px-3 py-2.5"/><select value={role} onChange={e => setRole(e.target.value as 'admin' | 'employee')} className="rounded-xl border border-[#E5DACD] px-2"><option value="employee">Funcionário</option><option value="admin">Administrador</option></select></div>
        <button className="w-full rounded-xl bg-[#96642F] py-2.5 text-sm font-bold text-white">Enviar convite</button>
        {message && <p className="text-sm text-[#7A4B1D]">{message}</p>}
      </form>}
      <div className="space-y-2">
        <h4 className="font-bold text-[#5C4533] flex items-center gap-2"><Users size={18}/> Pessoas com acesso</h4>
        {members.map(member => <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-[#E8DECF] p-3">
          <div className="w-10 h-10 rounded-full bg-[#E8DAC6] flex items-center justify-center font-bold text-[#7A4B1D]">{member.user.name.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="font-semibold text-[#4A3423] truncate">{member.user.name}</p><p className="text-xs text-[#8C7665] truncate">{member.user.email}</p></div>
          {member.role === 'owner' ? <span className="text-xs font-bold text-[#96642F]">Proprietário</span> : auth?.role === 'owner' ? <select value={member.role} onChange={e => void changeRole(member, e.target.value as 'admin' | 'employee')} className="rounded-lg border border-[#E5DACD] p-1 text-xs"><option value="employee">Funcionário</option><option value="admin">Administrador</option></select> : <span className="text-xs">{member.role === 'admin' ? 'Administrador' : 'Funcionário'}</span>}
          {canManage && member.role !== 'owner' && member.user.id !== auth?.user.id && <button onClick={() => void remove(member)} className="p-2 text-rose-600"><Trash2 size={16}/></button>}
        </div>)}
      </div>
    </div>
  </Modal>;
}
