import React, { useState } from 'react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { TextInput } from '../ui/Input';
import { Button } from '../ui/Button';

export const CustomerForm: React.FC<{ customer?: Customer | null; onBack: () => void }> = ({ customer, onBack }) => {
  const { saveCustomerAction } = useApp();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const saved = await saveCustomerAction({ id: customer?.id, name, phone, email, address, notes });
    setSaving(false);
    if (saved) onBack();
  };

  return <div className="min-h-screen bg-[#FAF7F2]"><AppHeader title={customer ? 'Editar cliente' : 'Novo cliente'} showBack onBack={onBack} />
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8"><form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E5DACD] p-5 sm:p-7 space-y-4 shadow-xs">
      <TextInput label="Nome" value={name} onChange={e => setName(e.target.value)} required autoFocus placeholder="Ex: Maria da Silva" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><TextInput label="Telefone / WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" /><TextInput label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" /></div>
      <TextInput label="Endereço" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro..." />
      <div><label className="block text-xs font-medium text-[#7A6453] mb-1">Observações</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full px-3 py-3 bg-[#FCFAF8] border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm text-[#302116]" placeholder="Preferências, alergias, datas importantes..." /></div>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cliente'}</Button></div>
    </form></div></div>;
};
