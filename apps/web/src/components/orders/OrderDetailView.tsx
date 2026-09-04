import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TagBadge } from '../ui/Badge';
import { OrderStatusStepper } from './OrderStatusStepper';
import { PaymentModal } from './PaymentModal';
import { ShareBudgetModal } from './ShareBudgetModal';
import {
  formatCurrency,
  formatDecimal,
  formatDateTime,
  ORDER_STATUS_MAP,
} from '../../services/costEngine';
import {
  FileText,
  Edit3,
  Plus,
  Trash2,
  Share2,
  Package,
  Cookie,
  CreditCard,
  QrCode,
  Banknote,
  Calendar,
  User,
  MapPin,
  Phone,
} from 'lucide-react';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onEdit: () => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ order, onBack, onEdit }) => {
  const { updateOrderStatusAction, removePaymentAction } = useApp();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const totalPaid = (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, order.totalCharged - totalPaid);

  const statusConfig = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.orcamento;

  const handleStatusChange = (newStatus: OrderStatus) => {
    updateOrderStatusAction(order.id, newStatus);
  };

  const handleCancelOrder = () => {
    updateOrderStatusAction(order.id, 'cancelado');
    setShowCancelConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <AppHeader
        title={`Detalhe da encomenda (${order.orderNumber})`}
        showBack
        onBack={onBack}
        rightAction={
          <button
            onClick={onEdit}
            className="p-2 text-white hover:bg-black/10 rounded-full transition-colors active:scale-95"
            title="Editar encomenda"
          >
            <Edit3 className="w-5 h-5 stroke-[2.2]" />
          </button>
        }
      />

      <div className="max-w-[1480px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="rounded-[2rem] bg-white p-4 shadow-sm sm:p-6 lg:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (col-span-7): Order Info, Stepper & Items */}
            <div className="lg:col-span-8 space-y-5">
              {/* Order Header Summary Card */}
              <div className="bg-[#FFF1E8] p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#FFFCF8] text-[#8D3157] shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="text-xs text-[#7A6453] uppercase font-semibold">Status</span>
                      <h2 className="text-xl font-bold text-[#302116] capitalize">
                        {statusConfig.label}
                      </h2>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEdit}
                    className="hidden sm:inline-flex"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </Button>
                </div>

                <div className="pt-3 border-t border-[#EADDE2] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <span className="text-[#7A6453] text-xs block">Cliente</span>
                    <span className="text-[#302116] font-semibold">{order.clientName}</span>
                  </div>

                  <div>
                    <span className="text-[#7A6453] text-xs block">Data e Hora de Entrega</span>
                    <span className="text-[#302116] font-semibold">
                      {formatDateTime(order.deliveryDate)}
                    </span>
                  </div>

                  {order.clientPhone && (
                    <div>
                      <span className="text-[#7A6453] text-xs block">Telefone</span>
                      <span className="text-[#302116] font-medium">{order.clientPhone}</span>
                    </div>
                  )}

                  {order.clientAddress && (
                    <div>
                      <span className="text-[#7A6453] text-xs block">Endereço</span>
                      <span className="text-[#302116] font-medium">{order.clientAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Stepper Card */}
              <OrderStatusStepper
                currentStatus={order.status}
                onStatusChange={handleStatusChange}
                onCancel={handleCancelOrder}
              />

              {/* Section Heading: Itens — only show when there is something to display */}
              {(order.items.length > 0 || order.materials.length > 0) && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-base font-bold text-[#302116] px-1">
                    Itens do pedido{' '}
                    <span className="ml-1 text-xs font-medium text-[#8C7665]">
                      ({order.items.length + order.materials.length})
                    </span>
                  </h3>

                  <div className="space-y-2.5">
                    {/* Product Items */}
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-4 rounded-2xl border border-[#EADDE2] shadow-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#FFF0F4] text-[#8D3157] flex items-center justify-center shrink-0">
                            <Cookie className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-[#302116]">
                              {item.productName}
                            </h4>
                            <p className="text-xs text-[#7A6453]">
                              {formatDecimal(item.quantity)} x {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                        </div>

                        <span className="text-base font-bold text-[#302116]">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}

                    {/* Material Items */}
                    {order.materials.map((mat) => (
                      <div
                        key={mat.id}
                        className="bg-white p-4 rounded-2xl border border-[#EADDE2] shadow-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#FFF1E8] text-[#8D3157] flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-[#302116]">
                                {mat.materialName}
                              </h4>
                              <TagBadge variant="material">Material</TagBadge>
                            </div>
                            <p className="text-xs text-[#7A6453]">
                              {formatDecimal(mat.quantity)} x {formatCurrency(mat.unitCost)} (custo)
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-[#7A6453]">
                          Custo: {formatCurrency(mat.totalCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (col-span-5): Financials, Payments, Actions */}
            <div className="lg:col-span-4 space-y-5">
              {/* Financial Summary Box */}
              <div className="p-5 bg-[#FFF1E8] rounded-3xl shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-[#302116] pb-1 border-b border-[#E5DACD]">
                  Resumo Financeiro
                </h3>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6B5747] font-medium">Subtotal</span>
                  <span className="text-[#302116] font-semibold">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-rose-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-[#E5DACD]">
                  <span className="text-[#302116]">Total cobrado</span>
                  <span className="text-[#302116] text-xl">
                    {formatCurrency(order.totalCharged)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-[#7A6453] pt-2 border-t border-[#E5DACD]">
                  <span>Custo estimado dos insumos</span>
                  <span className="font-semibold">{formatCurrency(order.estimatedCost)}</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-[#4A280F] font-bold">Lucro estimado</span>
                  <div className="text-right">
                    <span className="text-[#96642F] font-bold text-lg">
                      {formatCurrency(order.estimatedProfit)}
                    </span>
                    {order.profitMarginPercent > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 block">
                        ({formatDecimal(order.profitMarginPercent, 1)}% margem)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pagamentos Recebidos Section */}
              <div className="p-5 bg-white rounded-3xl border border-[#E5DACD] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#302116]">Pagamentos recebidos</h3>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="text-xs font-semibold text-[#845025] hover:text-[#633A18] flex items-center gap-1 bg-[#FAF3EB] px-3 py-1.5 rounded-xl border border-[#DFCFC0] transition-colors active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Registrar
                  </button>
                </div>

                {!order.payments || order.payments.length === 0 ? (
                  <p className="text-xs text-center py-4 text-[#8C7665] bg-[#FAF7F2] rounded-2xl border border-[#EFE8DE] italic">
                    Sem pagamentos registrados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {order.payments.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E5DACD] flex items-center justify-between shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#302116] capitalize">
                              {p.method.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-[#7A6453]">
                              {formatDateTime(p.paidAt)}
                            </span>
                          </div>
                          {p.notes && (
                            <p className="text-[11px] text-[#8A7565] italic">{p.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-emerald-700">
                            {formatCurrency(p.amount)}
                          </span>
                          <button
                            onClick={() => removePaymentAction(order.id, p.id)}
                            className="text-[#B5A191] hover:text-rose-600 p-1"
                            title="Excluir pagamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Status do Pagamento */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex justify-between items-center text-xs">
                      <span className="font-semibold text-amber-900">
                        {remaining === 0
                          ? '✅ Pedido Quitado'
                          : `Resta: ${formatCurrency(remaining)}`}
                      </span>
                      <span className="text-amber-800">
                        Pago: {formatCurrency(totalPaid)} / {formatCurrency(order.totalCharged)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action: Enviar Orçamento */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="caramel-outline"
                  fullWidth
                  size="lg"
                  onClick={() => setShowShareModal(true)}
                  className="border-[1.5px] border-[#845025] text-[#845025] bg-white shadow-xs font-semibold py-4"
                >
                  <FileText className="w-5 h-5 mr-2 stroke-[2.2]" /> Enviar orçamento (WhatsApp /
                  PDF)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          orderId={order.id}
          totalCharged={order.totalCharged}
          totalAlreadyPaid={totalPaid}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showShareModal && (
        <ShareBudgetModal
          order={order}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancelar encomenda"
        message="Tem certeza que deseja cancelar esta encomenda?"
        confirmLabel="Cancelar encomenda"
        onConfirm={handleCancelOrder}
      />
    </div>
  );
};
