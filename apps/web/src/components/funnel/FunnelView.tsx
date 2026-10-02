import React, { useMemo } from 'react';
import { ArrowRight, BarChart3, ChevronDown, ClipboardList, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { StatusBadge } from '../ui/Badge';
import { formatCurrency, formatDateTime, ORDER_STATUS_MAP } from '../../services/costEngine';
import { ACTIVE_FUNNEL_STATUSES, getSalesFunnelSummary } from '../../services/salesFunnel';
import { Order, OrderStatus } from '../../types';

interface FunnelViewProps {
  onSelectOrder: (order: Order) => void;
  onOpenSettings: () => void;
}

export const FunnelView: React.FC<FunnelViewProps> = ({ onSelectOrder, onOpenSettings }) => {
  const { orders, updateOrderStatusAction } = useApp();
  const summary = useMemo(() => getSalesFunnelSummary(orders), [orders]);

  const moveOrder = (orderId: string, status: OrderStatus) => {
    void updateOrderStatusAction(orderId, status);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader title="Funil de vendas" onOpenSettings={onOpenSettings} />
      <main className="mx-auto max-w-[1480px] space-y-5 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-[#E5DACD] bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A4B1D]">
                <BarChart3 className="h-4 w-4" /> Acompanhamento comercial
              </p>
              <h2 className="mt-1 font-serif text-2xl text-[#302116]">Todos os pedidos</h2>
              <p className="mt-1 text-sm text-[#8A7565]">
                Acompanhe cada pedido desde o orçamento até a entrega.
              </p>
            </div>
            <div className="rounded-2xl bg-[#F5ECE0] px-4 py-3 text-right">
              <span className="block text-[11px] font-semibold uppercase text-[#8A7565]">
                Pedidos ativos
              </span>
              <strong className="text-xl text-[#72203F]">
                {summary.stages.reduce((sum, stage) => sum + stage.count, 0)}
              </strong>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          {summary.stages.map((stage, index) => {
            const nextStatus = ACTIVE_FUNNEL_STATUSES[index + 1];
            return (
              <div key={stage.status} className="flex min-w-0 flex-col gap-3">
                <div className="rounded-2xl border border-[#E5DACD] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={stage.status} size="sm" />
                    <span className="text-xs font-bold text-[#7A6453]">{stage.count}</span>
                  </div>
                  <p className="mt-3 text-lg font-bold text-[#302116]">
                    {formatCurrency(stage.totalValue)}
                  </p>
                  <p className="text-[11px] text-[#8A7565]">valor total dos pedidos</p>
                </div>

                <div className="flex min-h-36 flex-col gap-3 rounded-2xl bg-[#F5ECE0]/70 p-2">
                  {stage.orders.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#DFCFC0] p-5 text-center text-xs text-[#A89484]">
                      <ClipboardList className="mb-2 h-5 w-5" />
                      Nenhum pedido nesta etapa
                    </div>
                  ) : (
                    stage.orders.map((order) => (
                      <article
                        key={order.id}
                        className="rounded-2xl border border-[#E5DACD] bg-white p-3 shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-[#302116]">
                                {order.clientName}
                              </h3>
                              <p className="text-[11px] text-[#8A7565]">{order.orderNumber}</p>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-[#96642F]">
                              {formatCurrency(order.totalCharged)}
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] text-[#7A6453]">
                            {order.deliveryDate
                              ? `Entrega: ${formatDateTime(order.deliveryDate)}`
                              : 'Entrega a definir'}
                          </p>
                        </button>
                        {nextStatus && (
                          <button
                            type="button"
                            onClick={() => moveOrder(order.id, nextStatus)}
                            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-[#F7E5EA] px-2 py-2 text-[11px] font-bold text-[#72203F] hover:bg-[#EBD2DD]"
                          >
                            Avançar para {ORDER_STATUS_MAP[nextStatus].label}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <label className="relative mt-2 block">
                          <span className="sr-only">Alterar etapa do pedido</span>
                          <select
                            value={order.status}
                            onChange={(event) =>
                              moveOrder(order.id, event.target.value as OrderStatus)
                            }
                            className="w-full appearance-none rounded-xl border border-[#E5DACD] bg-white px-2.5 py-2 pr-8 text-[11px] font-semibold text-[#7A6453]"
                          >
                            {ACTIVE_FUNNEL_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {ORDER_STATUS_MAP[status].label}
                              </option>
                            ))}
                            <option value="cancelado">{ORDER_STATUS_MAP.cancelado.label}</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A89484]" />
                        </label>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              <div>
                <h2 className="text-sm font-bold text-rose-900">Perdidos / cancelados</h2>
                <p className="text-xs text-rose-700">Pedidos que saíram do fluxo ativo.</p>
              </div>
            </div>
            <div className="text-right">
              <strong className="text-lg text-rose-900">{summary.canceled.count}</strong>
              <span className="ml-2 text-xs text-rose-700">
                {formatCurrency(summary.canceled.totalValue)}
              </span>
            </div>
          </div>
          {summary.canceled.orders.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.canceled.orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-left text-xs text-rose-900"
                >
                  <strong>{order.clientName}</strong> · {order.orderNumber}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
