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
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title="Painel & Relatórios"
        onOpenSettings={onOpenSettings}
        rightAction={
          <Button size="sm" onClick={onNewOrder} className="shadow-none font-semibold">
            <Plus className="w-4 h-4" /> Nova Encomenda
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main Profit KPI Card */}
          <div className="bg-[#B57E44] text-white p-5 rounded-3xl shadow-md flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-semibold text-amber-100 tracking-wider">
                Lucro Estimado
              </span>
              <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {formatDecimal(averageMargin, 1)}%
              </span>
            </div>
            <div className="py-2">
              <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
                {formatCurrency(totalProfit)}
              </h2>
            </div>
            <div className="text-xs text-amber-100 flex justify-between border-t border-white/20 pt-2">
              <span>Receita: {formatCurrency(totalRevenue)}</span>
              <span>Custos: {formatCurrency(totalCost)}</span>
            </div>
          </div>

          {/* Caixa Recebido */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5DACD] shadow-xs flex flex-col justify-between">
            <span className="text-xs uppercase font-bold text-[#7A6453] tracking-wider">
              Total Pago (Caixa)
            </span>
            <div className="py-2">
              <h2 className="text-2xl font-bold text-emerald-700 tracking-tight">
                {formatCurrency(totalCollected)}
              </h2>
            </div>
            <span className="text-xs text-stone-500 border-t border-[#F2ECE1] pt-2">
              A receber: {formatCurrency(Math.max(0, totalRevenue - totalCollected))}
            </span>
          </div>

          {/* Encomendas Ativas */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5DACD] shadow-xs flex flex-col justify-between">
            <span className="text-xs uppercase font-bold text-[#7A6453] tracking-wider">
              Encomendas Ativas
            </span>
            <div className="py-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-[#302116]">
                {ordersConfirmed.length + ordersInProduction.length + ordersReady.length}
              </span>
              <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                {ordersInProduction.length} em produção
              </span>
            </div>
            <span className="text-xs text-stone-500 border-t border-[#F2ECE1] pt-2">
              {ordersQuote.length} orçamentos pendentes
            </span>
          </div>

          {/* Insumos & Receitas */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5DACD] shadow-xs flex flex-col justify-between">
            <span className="text-xs uppercase font-bold text-[#7A6453] tracking-wider">
              Base de Produtos
            </span>
            <div className="py-2 flex items-center gap-2">
              <span className="text-2xl font-bold text-[#96642F]">{products.length}</span>
              <span className="text-xs text-[#7A6453]">receitas cadastradas</span>
            </div>
            <span className="text-xs text-stone-500 border-t border-[#F2ECE1] pt-2">
              {ingredients.length} insumos • {materials.length} embalagens
            </span>
          </div>
        </div>

        {/* 2-Column Desktop Grid for Deliveries and Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upcoming Orders (col-span-7) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-[#302116] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#96642F]" /> Próximas Entregas
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-[#96642F] hover:underline"
              >
                Ver todas ({nonCancelledOrders.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {nonCancelledOrders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onSelectOrder(ord)}
                  className="bg-white p-4 rounded-2xl border border-[#E5DACD] shadow-xs cursor-pointer hover:bg-[#FAF6F0] flex items-center justify-between transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#302116]">{ord.clientName}</span>
                      <StatusBadge status={ord.status} size="sm" />
                    </div>
                    <p className="text-xs text-[#7A6453] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#96642F]" />
                      {formatDateTime(ord.deliveryDate)}
                    </p>
                  </div>

                  <span className="text-base font-bold text-[#96642F]">
                    {formatCurrency(ord.totalCharged)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Alerts & Quick Pipeline (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Low Stock Alerts */}
            <div className="p-5 bg-amber-50/80 rounded-3xl border border-amber-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Alertas de Estoque Baixo ({lowStockMaterials.length})</span>
              </div>

              {lowStockMaterials.length === 0 ? (
                <p className="text-xs text-emerald-800 bg-white/70 p-3 rounded-2xl">
                  ✅ Todos os materiais estão com estoque saudável!
                </p>
              ) : (
                <div className="space-y-2">
                  {lowStockMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      onClick={() => setActiveTab('materials')}
                      className="bg-white p-3 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-100/40"
                    >
                      <span className="font-semibold text-[#302116]">{mat.name}</span>
                      <span className="font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-md">
                        Restam {formatDecimal(mat.stockQuantity)} {mat.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pipeline Visual Shortcuts */}
            <div className="p-5 bg-white rounded-3xl border border-[#E5DACD] shadow-xs space-y-3">
              <h4 className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider">
                Status da Produção
              </h4>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div
                  onClick={() => setActiveTab('orders')}
                  className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E5DACD] cursor-pointer hover:bg-purple-50"
                >
                  <span className="text-lg font-bold text-purple-600 block">
                    {ordersInProduction.length}
                  </span>
                  <span className="text-[#7A6453]">Produzindo</span>
                </div>

                <div
                  onClick={() => setActiveTab('orders')}
                  className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E5DACD] cursor-pointer hover:bg-emerald-50"
                >
                  <span className="text-lg font-bold text-emerald-600 block">
                    {ordersReady.length}
                  </span>
                  <span className="text-[#7A6453]">Prontas para Entrega</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
