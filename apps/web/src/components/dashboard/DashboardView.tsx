import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { TagBadge, StatusBadge } from '../ui/Badge';
import {
  formatCurrency,
  formatDateTime,
  formatDecimal,
  ORDER_STATUS_MAP,
} from '../../services/costEngine';
import {
  TrendingUp,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  Calendar,
  Sparkles,
  Package,
  Plus,
  Cake,
  CheckCircle2,
} from 'lucide-react';
import { Order } from '../../types';

interface DashboardViewProps {
  onSelectOrder: (order: Order) => void;
  onNewOrder: () => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectOrder,
  onNewOrder,
  onOpenSettings,
}) => {
  const { orders, materials, products, ingredients, setActiveTab } = useApp();

  // Metrics
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelado');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.totalCharged, 0);
  const totalCost = nonCancelledOrders.reduce((sum, o) => sum + o.estimatedCost, 0);
  const totalProfit = nonCancelledOrders.reduce((sum, o) => sum + o.estimatedProfit, 0);
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Total collected payments
  const totalCollected = orders.reduce((sum, o) => {
    return sum + (o.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);

  // Low stock materials
  const lowStockMaterials = materials.filter(
    (m) => m.trackStock && m.stockQuantity <= (m.minStockAlert || 5)
  );

  // Status breakdown
  const ordersInProduction = orders.filter((o) => o.status === 'produzindo');
  const ordersReady = orders.filter((o) => o.status === 'pronto');
  const ordersConfirmed = orders.filter((o) => o.status === 'confirmado');
  const ordersQuote = orders.filter((o) => o.status === 'orcamento');

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <AppHeader title="Painel & Relatórios" onOpenSettings={onOpenSettings} />

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Main Financial KPI Card */}
        <div className="bg-[#B57E44] text-white p-5 rounded-3xl shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-semibold text-amber-100 tracking-wider">
              Lucro Estimado Acumulado
            </span>
            <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
              {formatDecimal(averageMargin, 1)}% Margem
            </span>
          </div>

          <div>
            <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
              {formatCurrency(totalProfit)}
            </h2>
            <p className="text-xs text-amber-100 mt-0.5">
              Receita Total: {formatCurrency(totalRevenue)} • Custos: {formatCurrency(totalCost)}
            </p>
          </div>

          <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-amber-200 block">Total Recebido (Caixa)</span>
              <strong className="text-white text-sm">{formatCurrency(totalCollected)}</strong>
            </div>
            <div>
              <span className="text-amber-200 block">A Receber</span>
              <strong className="text-white text-sm">
                {formatCurrency(Math.max(0, totalRevenue - totalCollected))}
              </strong>
            </div>
          </div>
        </div>

        {/* Quick Status Overview Cards */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div
            onClick={() => setActiveTab('orders')}
            className="bg-white p-2.5 rounded-2xl border border-[#E5DACD] cursor-pointer hover:bg-amber-50/50 shadow-xs"
          >
            <span className="text-xs text-[#7A6453] block">Orçamentos</span>
            <span className="text-lg font-bold text-[#B57E44]">{ordersQuote.length}</span>
          </div>

          <div
            onClick={() => setActiveTab('orders')}
            className="bg-white p-2.5 rounded-2xl border border-[#E5DACD] cursor-pointer hover:bg-blue-50/50 shadow-xs"
          >
            <span className="text-xs text-[#7A6453] block">Confirmadas</span>
            <span className="text-lg font-bold text-blue-600">{ordersConfirmed.length}</span>
          </div>

          <div
            onClick={() => setActiveTab('orders')}
            className="bg-white p-2.5 rounded-2xl border border-[#E5DACD] cursor-pointer hover:bg-purple-50/50 shadow-xs"
          >
            <span className="text-xs text-[#7A6453] block">Produzindo</span>
            <span className="text-lg font-bold text-purple-600">{ordersInProduction.length}</span>
          </div>

          <div
            onClick={() => setActiveTab('orders')}
            className="bg-white p-2.5 rounded-2xl border border-[#E5DACD] cursor-pointer hover:bg-emerald-50/50 shadow-xs"
          >
            <span className="text-xs text-[#7A6453] block">Prontas</span>
            <span className="text-lg font-bold text-emerald-600">{ordersReady.length}</span>
          </div>
        </div>

        {/* Low Stock Alert Section */}
        {lowStockMaterials.length > 0 && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Atenção: Materiais com Estoque Baixo ({lowStockMaterials.length})</span>
            </div>

            <div className="space-y-1.5">
              {lowStockMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => setActiveTab('materials')}
                  className="bg-white p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-100/30"
                >
                  <span className="font-semibold text-[#302116]">{mat.name}</span>
                  <span className="font-bold text-amber-800">
                    Restam apenas {formatDecimal(mat.stockQuantity)} {mat.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Orders Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-[#302116] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#96642F]" /> Próximas Entregas
            </h3>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-[#96642F] hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-2">
            {nonCancelledOrders.slice(0, 3).map((ord) => (
              <div
                key={ord.id}
                onClick={() => onSelectOrder(ord)}
                className="bg-white p-3.5 rounded-2xl border border-[#E5DACD] shadow-xs cursor-pointer hover:bg-[#FAF6F0] flex items-center justify-between transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#302116]">{ord.clientName}</span>
                    <StatusBadge status={ord.status} size="sm" />
                  </div>
                  <p className="text-xs text-[#7A6453] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#96642F]" />
                    {formatDateTime(ord.deliveryDate)}
                  </p>
                </div>

                <span className="text-sm font-bold text-[#96642F]">
                  {formatCurrency(ord.totalCharged)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Database Summary */}
        <div className="p-4 bg-white rounded-2xl border border-[#E5DACD] shadow-xs grid grid-cols-3 gap-2 text-center text-xs">
          <div onClick={() => setActiveTab('ingredients')} className="cursor-pointer hover:opacity-80">
            <span className="text-lg font-bold text-[#302116]">{ingredients.length}</span>
            <span className="text-[#7A6453] block">Ingredientes</span>
          </div>
          <div onClick={() => setActiveTab('materials')} className="cursor-pointer hover:opacity-80">
            <span className="text-lg font-bold text-[#302116]">{materials.length}</span>
            <span className="text-[#7A6453] block">Materiais</span>
          </div>
          <div onClick={() => setActiveTab('products')} className="cursor-pointer hover:opacity-80">
            <span className="text-lg font-bold text-[#302116]">{products.length}</span>
            <span className="text-[#7A6453] block">Receitas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
