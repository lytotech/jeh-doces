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
      } catch (e) {
        // silent fallback
      }
    }
    onStatusChange(status);
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-[#E5DACD] shadow-xs space-y-3">
      <h3 className="text-sm font-semibold text-[#302116]">Status</h3>

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
                  ? 'bg-[#F6ECE0] border-[#96642F] shadow-xs font-semibold'
                  : 'bg-white border-[#EFE8DE] hover:bg-[#FAF6F0] text-[#543015]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-[#845025] text-white'
                      : isPast
                      ? 'bg-[#D7BC9B] text-[#543015]'
                      : 'bg-[#EFE8DE] text-[#7A6453]'
                  }`}
                >
                  {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
                </div>
                <span className={`text-sm ${isCurrent ? 'text-[#4A280F] font-bold' : 'text-[#4A3828]'}`}>
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
