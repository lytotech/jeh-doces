import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { formatCurrency, formatDateTime } from '../../services/costEngine';
import { Plus, Search, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';

interface OrderListProps {
  onSelectOrder: (order: Order) => void;
  onNewOrder: () => void;
  onOpenSettings: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  onSelectOrder,
  onNewOrder,
  onOpenSettings,
}) => {
  const { orders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filtered = orders.filter((ord) => {
    const matchesSearch =
      ord.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterTabs = [
    { id: 'todos', label: 'Todas' },
    { id: 'orcamento', label: 'Orçamentos' },
    { id: 'confirmado', label: 'Confirmadas' },
    { id: 'produzindo', label: 'Produzindo' },
    { id: 'pronto', label: 'Prontas' },
    { id: 'entregue', label: 'Entregues' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title="Encomendas & Orçamentos"
        onOpenSettings={onOpenSettings}
        rightAction={
          <Button size="sm" onClick={onNewOrder} className="!bg-[#6B1F3B] font-semibold shadow-md ring-1 ring-white/30 hover:!bg-[#54172F]">
            <Plus className="w-4 h-4" /> Nova Encomenda
          </Button>
        }
      />

      <div className="max-w-[1480px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A89484] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente ou nº do pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm font-medium text-[#302116] placeholder-[#B0A294] transition-colors shadow-xs"
            />
          </div>

          {/* Status Filter Scrollable Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#96642F] text-white shadow-xs'
                    : 'bg-white text-[#7A6453] border border-[#E5DACD] hover:bg-[#F6ECE0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between text-xs text-[#7A6453] px-1">
          <span>{filtered.length} encomendas encontradas</span>
          <span className="hidden sm:inline">Clique no card para abrir os detalhes</span>
        </div>

        {/* Orders Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E5DACD] p-8 max-w-md mx-auto">
            <ClipboardList className="w-12 h-12 text-[#D7BC9B] mx-auto mb-3" />
            <p className="font-serif text-xl font-medium text-[#4A3828]">
              Nenhuma encomenda encontrada
            </p>
            <p className="text-xs text-[#8A7565] mt-1.5 mb-5">
              Crie um novo orçamento ou encomenda para gerenciar produção e pagamentos.
            </p>
            <Button size="md" onClick={onNewOrder}>
              <Plus className="w-4 h-4" /> Criar Nova Encomenda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {filtered.map((ord) => {
              const totalPaid = (ord.payments || []).reduce((sum, p) => sum + p.amount, 0);
              const isPaid = totalPaid >= ord.totalCharged && ord.totalCharged > 0;
              const isOverdue =
                !['cancelado', 'entregue'].includes(ord.status) &&
                new Date(ord.deliveryDate).getTime() < Date.now();

              return (
                <div
                  key={ord.id}
                  onClick={() => onSelectOrder(ord)}
                  className={`bg-white hover:bg-white p-4 sm:p-5 rounded-3xl border shadow-xs hover:shadow-card cursor-pointer transition-shadow space-y-3 flex flex-col justify-between group ${
                    isOverdue
                      ? 'border-red-200 hover:border-red-200'
                      : 'border-[#E5DACD] hover:border-[#E5DACD]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[#302116] truncate">
                            {ord.clientName}
                          </h3>
                          <span className="text-xs font-semibold text-[#8C7665] shrink-0">
                            {ord.orderNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#7A6453]">
                          <Calendar className="w-3.5 h-3.5 text-[#96642F] shrink-0" />
                          <span className={isOverdue ? 'font-semibold text-red-700' : undefined}>
                            {formatDateTime(ord.deliveryDate)}
                          </span>
                          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                        </div>
                      </div>

                      <StatusBadge status={ord.status} size="sm" />
                    </div>

                    {/* Items summary */}
                    <div className="text-xs text-[#5C4533] bg-[#FAF7F2] p-2.5 rounded-xl flex items-center justify-between">
                      <span className="truncate pr-2">
                        {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ') ||
                          'Sem doces'}
                      </span>
                      <span className="text-right shrink-0 leading-tight">
                        <span className="block text-[10px] text-[#8C7665]">Cobrado</span>
                        <span className="font-bold text-sm text-[#96642F]">
                          {formatCurrency(ord.totalCharged)}
                        </span>
                        <span className="block text-[10px] text-[#7A6453]">
                          Custo: {formatCurrency(ord.estimatedCost)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE1] text-[11px] text-[#7A6453]">
                    <span>
                      Lucro:{' '}
                      <strong className="text-emerald-700">
                        {formatCurrency(ord.estimatedProfit)}
                      </strong>
                    </span>
                    {isPaid ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ● Quitado
                      </span>
                    ) : totalPaid > 0 ? (
                      <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Pago {formatCurrency(totalPaid)}
                      </span>
                    ) : (
                      <span className="text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        Pendente
                      </span>
                    )}
                    {!isPaid && ord.totalCharged > totalPaid && (
                      <span className="text-[#7A6453]">
                        A receber: {formatCurrency(ord.totalCharged - totalPaid)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
