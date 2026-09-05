import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props { isOpen: boolean; onClose: () => void; onConfirm: () => Promise<void>; }
export function DeleteAccountDialog({ isOpen, onClose, onConfirm }: Props) {
  const [value, setValue] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const close = () => { if (!busy) { setValue(''); onClose(); } };
  const confirm = async () => { if (value.trim().toUpperCase() !== 'EXCLUIR' || busy) return; setBusy(true); try { await onConfirm(); close(); } finally { setBusy(false); } };
  return <Modal isOpen={isOpen} onClose={close} title="Excluir dados da empresa" maxWidth="sm"><div className="space-y-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle className="h-5 w-5" /></div><div className="text-sm leading-6 text-[#5C4533]"><p>O plano será cancelado agora e a empresa ficará disponível por <strong>90 dias</strong> para recuperação.</p><p className="mt-1">Depois desse prazo, ela será marcada como inativa. Digite <strong>EXCLUIR</strong> para confirmar.</p></div></div><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="Digite EXCLUIR" className="w-full rounded-xl border border-[#E5DACD] bg-white px-4 py-3 text-sm uppercase text-[#302116]" /><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close} disabled={busy}>Voltar</Button><Button type="button" disabled={busy || value.trim().toUpperCase() !== 'EXCLUIR'} onClick={() => void confirm()} className="bg-rose-600 hover:bg-rose-700">{busy ? 'Agendando…' : 'Agendar exclusão'}</Button></div></div></Modal>;
}
