import React, { useState } from 'react';
import { PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Input';
import { formatCurrency } from '../../services/costEngine';
import { DollarSign, QrCode, Banknote, CreditCard, Layers } from 'lucide-react';

interface PaymentModalProps {
  orderId: string;
  totalCharged: number;
  totalAlreadyPaid: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  totalCharged,
  totalAlreadyPaid,
  isOpen,
  onClose,
}) => {
  const { addPaymentAction } = useApp();

  const remaining = Math.max(0, totalCharged - totalAlreadyPaid);
  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : '0.00');
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().slice(0, 16) // format for datetime-local
  );
  const [notes, setNotes] = useState('');

  const paymentMethods: { value: PaymentMethod; label: string; icon: any }[] = [
    { value: 'pix', label: 'Pix', icon: QrCode },
    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
    { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
    { value: 'transferencia', label: 'Transferência', icon: Layers },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (numAmount <= 0) return;

    addPaymentAction(orderId, {
      amount: numAmount,
      method,
      paidAt: new Date(paidAt).toISOString(),
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pagamento"
      subtitle={`Saldo a pagar: ${formatCurrency(remaining)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Method Picker */}
        <div>
          <label className="block text-xs font-semibold text-[#7A6453] uppercase mb-2">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#96642F] text-white border-[#96642F] shadow-xs'
                      : 'bg-white text-[#543015] border-[#E5DACD] hover:bg-[#FAF6F0]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <TextInput
          label="Valor Pago (R$)"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          required
        />

        {/* Quick Amount Helpers */}
        {remaining > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7A4B1D] font-medium">Atalhos:</span>
            <button
              type="button"
              onClick={() => setAmount(remaining.toFixed(2))}
              className="text-xs px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200 font-semibold text-amber-900"
            >
              Valor Total ({formatCurrency(remaining)})
            </button>
            <button
              type="button"
              onClick={() => setAmount((remaining / 2).toFixed(2))}
              className="text-xs px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200 font-semibold text-amber-900"
            >
              50% ({formatCurrency(remaining / 2)})
            </button>
          </div>
        )}

        {/* Date / Time */}
        <TextInput
          label="Data e Hora do Pagamento"
          type="datetime-local"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          required
        />

        {/* Notes */}
        <TextInput
          label="Observações / Comprovante"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Sinal de 50%, Chave Pix enviada..."
        />

        <div className="pt-2 flex gap-2.5">
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth>
            Confirmar Pagamento
          </Button>
        </div>
      </form>
    </Modal>
  );
};
