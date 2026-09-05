import React from 'react';
import { OrderStatus } from '../../types';
import { ORDER_STATUS_STEPS, ORDER_STATUS_MAP } from '../../services/costEngine';
import { ChevronRight, XCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  onCancel: () => void;
}

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({
  currentStatus,
  onStatusChange,
  onCancel,
}) => {
  const isCancelled = currentStatus === 'cancelado';

  const handleStepClick = (status: OrderStatus) => {
    if (status === 'entregue' && currentStatus !== 'entregue') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // silent fallback
      }
    }
    onStatusChange(status);
  };

  return (
    <div className="bg-white p-4 rounded-3xl shadow-xs space-y-3">
      <h3 className="text-sm font-semibold text-[#302116]">Status</h3>

      {currentStatus === 'orcamento' && (
        <button
          type="button"
          onClick={() => onStatusChange('confirmado')}
          className="w-full rounded-2xl bg-[#8D3157] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#742747]"
        >
          Confirmar orçamento e reservar encomenda
        </button>
      )}

      <div className="space-y-2">
        {ORDER_STATUS_STEPS.map((statusKey, index) => {
          const stepNum = index + 1;
          const config = ORDER_STATUS_MAP[statusKey];
          const isCurrent = currentStatus === statusKey;
          const currentIndex = ORDER_STATUS_STEPS.indexOf(currentStatus);
          const isPast = currentIndex >= 0 && index < currentIndex;

          return (
            <div
              key={statusKey}
              onClick={() => handleStepClick(statusKey)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                isCurrent
                  ? 'bg-[#FFF0F4] border-[#D69A88] shadow-xs font-semibold'
                  : 'bg-[#FFFCF8] border-[#EADDE2] hover:bg-[#FFF8F2] text-[#543015]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-[#8D3157] text-white'
                      : isPast
                        ? 'bg-[#F0CBD6] text-[#63304B]'
                        : 'bg-[#F1E7EC] text-[#756878]'
                  }`}
                >
                  {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
                </div>
                <span
                  className={`text-sm ${isCurrent ? 'text-[#4A280F] font-bold' : 'text-[#4A3828]'}`}
                >
                  {config.label}
                </span>
                {isCurrent && (
                  <span className="bg-[#6B4019] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Atual
                  </span>
                )}
              </div>

              {!isCurrent && <ChevronRight className="w-4 h-4 text-[#A89484]" />}
            </div>
          );
        })}
      </div>

      {/* Botão Cancelar encomenda */}
      <button
        type="button"
        onClick={onCancel}
        className={`w-full mt-2 py-2.5 px-4 rounded-2xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          isCancelled
            ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
            : 'border-rose-300 text-rose-600 bg-white hover:bg-rose-50'
        }`}
      >
        <XCircle className="w-4 h-4" />
        {isCancelled ? 'Encomenda Cancelada' : 'Cancelar encomenda'}
      </button>
    </div>
  );
};
