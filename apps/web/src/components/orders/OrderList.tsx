import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import {
  formatCurrency,
  formatDateTime,
  ORDER_STATUS_MAP,
} from '../../services/costEngine';
import { Plus, Search, ClipboardList, ChevronRight, Calendar, User } from 'lucide-react';
import { Order, OrderStatus } from '../../types';

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
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <AppHeader
        title="Jeh Doces"
        onOpenSettings={onOpenSettings}
        rightAction={
          <Button size="sm" onClick={onNewOrder} className="shadow-none">
            <Plus className="w-4 h-4" /> Nova
          </Button>
        }
      />

      <div className="max-w-md mx-auto p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A89484] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente ou nº do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm font-medium text-[#302116] placeholder-[#B0A294] transition-colors"
          />
        </div>

        {/* Status Filter Scrollable Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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

        {/* Count */}
        <div className="flex items-center justify-between text-xs text-[#7A6453] px-1">
          <span>{filtered.length} encomendas</span>
          <span>Ordem por data de entrega</span>
        </div>

        {/* Orders List */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#E5DACD] p-6">
              <ClipboardList className="w-12 h-12 text-[#D7BC9B] mx-auto mb-2" />
              <p className="font-serif text-lg font-medium text-[#4A3828]">Nenhuma encomenda encontrada</p>
              <p className="text-xs text-[#8A7565] mt-1 mb-4">
                Crie um novo orçamento ou encomenda para gerenciar produção e pagamentos.
              </p>
              <Button size="sm" onClick={onNewOrder}>
                <Plus className="w-4 h-4" /> Criar Encomenda
              </Button>
            </div>
          ) : (
            filtered.map((ord) => {
              const totalPaid = (ord.payments || []).reduce((sum, p) => sum + p.amount, 0);
              const isPaid = totalPaid >= ord.totalCharged && ord.totalCharged > 0;

              return (
                <div
                  key={ord.id}
                  onClick={() => onSelectOrder(ord)}
                  className="bg-white hover:bg-[#FAF6F0] p-4 rounded-2xl border border-[#E5DACD] shadow-xs cursor-pointer transition-all space-y-2 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#302116]">{ord.clientName}</span>
                        <span className="text-xs font-semibold text-[#8C7665]">
                          {ord.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#7A6453]">
                        <Calendar className="w-3.5 h-3.5 text-[#96642F]" />
                        <span>{formatDateTime(ord.deliveryDate)}</span>
                      </div>
                    </div>

                    <StatusBadge status={ord.status} />
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-[#5C4533] bg-[#FAF7F2] p-2 rounded-xl flex items-center justify-between">
                    <span className="truncate max-w-[200px]">
                      {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </span>
                    <span className="font-bold text-sm text-[#96642F] shrink-0 ml-2">
                      {formatCurrency(ord.totalCharged)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#7A6453]">
                    <span>
                      Lucro estimado: <strong className="text-emerald-700">{formatCurrency(ord.estimatedProfit)}</strong>
                    </span>
                    {isPaid ? (
                      <span className="text-emerald-700 font-bold">● Pago</span>
                    ) : totalPaid > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        Pago {formatCurrency(totalPaid)} / Resta {formatCurrency(ord.totalCharged - totalPaid)}
                      </span>
                    ) : (
                      <span className="text-stone-500">Pendente de pagamento</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
