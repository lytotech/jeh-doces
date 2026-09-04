import React, { useMemo, useState } from 'react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import {
  Plus,
  Search,
  UserRound,
  ArchiveRestore,
  Archive,
  Trash2,
  ChevronRight,
} from 'lucide-react';

export const CustomerList: React.FC<{
  onSelectCustomer: (customer: Customer) => void;
  onNewCustomer: () => void;
}> = ({ onSelectCustomer, onNewCustomer }) => {
  const { customers, archiveCustomerAction, deleteCustomerAction } = useApp();
  const [term, setTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const visible = useMemo(
    () =>
      customers.filter(
        (c) =>
          (showArchived || !c.archivedAt) &&
          [c.name, c.phone, c.email].some((v) => v?.toLowerCase().includes(term.toLowerCase())),
      ),
    [customers, term, showArchived],
  );
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title="Clientes"
        rightAction={
          <Button size="sm" onClick={onNewCustomer}>
            <Plus className="w-4 h-4" /> Novo cliente
          </Button>
        }
      />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="w-4 h-4 text-[#A89484] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] rounded-2xl text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#7A6453]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />{' '}
            Mostrar arquivados
          </label>
        </div>
        {visible.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E5DACD]">
            <UserRound className="w-12 h-12 text-[#D7BC9B] mx-auto mb-3" />
            <p className="font-serif text-xl text-[#4A3828]">Nenhum cliente encontrado</p>
            <Button className="mt-5" onClick={onNewCustomer}>
              <Plus className="w-4 h-4" /> Cadastrar cliente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-[#E5DACD] p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#F5ECE0] text-[#96642F] flex items-center justify-center">
                  <UserRound className="w-5 h-5" />
                </div>
                <button onClick={() => onSelectCustomer(c)} className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-[#302116] truncate">{c.name}</p>
                  <p className="text-xs text-[#7A6453] truncate">
                    {c.phone || c.email || 'Sem contato cadastrado'}
                  </p>
                </button>
                <button
                  type="button"
                  title={c.archivedAt ? 'Restaurar' : 'Arquivar'}
                  onClick={() => void archiveCustomerAction(c.id, !c.archivedAt)}
                  className="p-2 text-[#96642F] hover:bg-[#F5ECE0] rounded-xl"
                >
                  {c.archivedAt ? (
                    <ArchiveRestore className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  title="Excluir cliente"
                  onClick={() => {
                    const confirmed = confirm(
                      'Excluir este cliente permanentemente? As encomendas vinculadas serão mantidas, mas ficarão sem cliente cadastrado.',
                    );
                    if (confirmed) void deleteCustomerAction(c.id);
                  }}
                  className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-[#C4B2A0]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
