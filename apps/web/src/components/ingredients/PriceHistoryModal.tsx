import React, { useState } from 'react';
import { Ingredient } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Input';
import { formatCurrency, formatDecimal, formatDateOnly } from '../../services/costEngine';
import { TrendingUp, Plus, Calendar, DollarSign } from 'lucide-react';

interface PriceHistoryModalProps {
  ingredient: Ingredient;
  isOpen: boolean;
  onClose: () => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  ingredient,
  isOpen,
  onClose,
}) => {
  const { addPriceHistoryAction } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPaidPrice, setNewPaidPrice] = useState(ingredient.paidPrice.toString());
  const [newPackageQty, setNewPackageQty] = useState(ingredient.packageQuantity.toString());
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const paid = parseFloat(newPaidPrice.replace(',', '.')) || 0;
    const qty = parseFloat(newPackageQty.replace(',', '.')) || 1;
    const unitCost = paid / (qty > 0 ? qty : 1);

    try {
      await addPriceHistoryAction(ingredient.id, {
        date: new Date().toISOString(),
        paidPrice: paid,
        packageQuantity: qty,
        unitCost,
        notes: newNotes.trim() || undefined,
      });
      setShowAddForm(false);
      setNewNotes('');
    } finally {
      setSaving(false);
    }
  };

  const history = ingredient.priceHistory || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico de preço"
      subtitle={`Ingrediente: ${ingredient.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8DECFC]">
          <div>
            <span className="text-xs text-[#7A6453] uppercase font-semibold">Custo Atual</span>
            <p className="text-lg font-bold text-[#96642F]">
              {formatCurrency(ingredient.unitCost)}{' '}
              <span className="text-xs font-normal text-[#7A6453]">/{ingredient.unit}</span>
            </p>
          </div>
          <Button
            size="sm"
            variant={showAddForm ? 'outline' : 'primary'}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              'Cancelar'
            ) : (
              <>
                <Plus className="w-4 h-4" /> Novo Registro
              </>
            )}
          </Button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddPrice}
            className="p-4 bg-[#F7F2EB] rounded-2xl border border-[#DFCFC0] space-y-3 animate-fadeIn"
          >
            <h4 className="text-sm font-semibold text-[#543015] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#96642F]" /> Registrar novo preço pago
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <TextInput
                label="Valor Pago (R$)"
                type="number"
                step="0.01"
                value={newPaidPrice}
                onChange={(e) => setNewPaidPrice(e.target.value)}
                required
              />
              <TextInput
                label={`Quantidade (${ingredient.unit})`}
                type="number"
                step="any"
                value={newPackageQty}
                onChange={(e) => setNewPackageQty(e.target.value)}
                required
              />
            </div>
            <TextInput
              label="Observação (Ex: Mercado X, Reajuste)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Opcional..."
            />
            <Button disabled={saving} type="submit" fullWidth size="sm">
              {saving ? 'Salvando…' : 'Salvar novo valor'}
            </Button>
          </form>
        )}

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="text-sm text-center py-6 text-[#8C7665]">
              Nenhum histórico registrado além do valor inicial.
            </p>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="bg-white p-3.5 rounded-2xl border border-[#E5DACD] flex items-center justify-between shadow-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#7A6453]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateOnly(record.date)}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#302116]">
                    {formatCurrency(record.paidPrice)}{' '}
                    <span className="text-xs font-normal text-[#7A6453]">
                      ({formatDecimal(record.packageQuantity)} {ingredient.unit})
                    </span>
                  </p>
                  {record.notes && <p className="text-xs text-[#8A7565] italic">{record.notes}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7A6453] uppercase font-medium">
                    Custo Unitário
                  </span>
                  <p className="text-sm font-bold text-[#96642F]">
                    {formatCurrency(record.unitCost)}/{ingredient.unit}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <Button variant="outline" fullWidth onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
};
