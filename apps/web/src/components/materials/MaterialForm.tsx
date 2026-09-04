import React, { useState, useMemo } from 'react';
import { Material } from '../../types';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { TextInput, Switch } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency, calculateMaterialUnitCost } from '../../services/costEngine';
import { Trash2 } from 'lucide-react';

interface MaterialFormProps {
  material?: Material | null;
  onBack: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({ material, onBack }) => {
  const { saveMaterialAction, deleteMaterialAction } = useApp();

  const isEditing = !!material?.id;

  const [name, setName] = useState(material?.name || '');
  const [unit, setUnit] = useState(material?.unit || 'un');
  const [baseQuantity, setBaseQuantity] = useState(
    material ? material.baseQuantity.toString() : '10',
  );
  const [totalCost, setTotalCost] = useState(material ? material.totalCost.toString() : '0');
  const [trackStock, setTrackStock] = useState(material ? material.trackStock : true);
  const [stockQuantity, setStockQuantity] = useState(
    material ? material.stockQuantity.toString() : '10',
  );

  const numericTotalCost = parseFloat(totalCost.replace(',', '.')) || 0;
  const numericBaseQty = parseFloat(baseQuantity.replace(',', '.')) || 1;
  const numericStockQty = parseFloat(stockQuantity.replace(',', '.')) || 0;

  const unitCost = useMemo(() => {
    return calculateMaterialUnitCost(numericTotalCost, numericBaseQty);
  }, [numericTotalCost, numericBaseQty]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveMaterialAction({
      id: material?.id,
      name: name.trim(),
      unit: unit.trim() || 'un',
      baseQuantity: numericBaseQty,
      totalCost: numericTotalCost,
      unitCost,
      trackStock,
      stockQuantity: trackStock ? numericStockQty : 0,
    });

    onBack();
  };

  const handleDelete = () => {
    if (material?.id && confirm('Deseja realmente remover este material?')) {
      deleteMaterialAction(material.id);
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <AppHeader
        title={isEditing ? 'Editar material' : 'Novo material'}
        showBack
        onBack={onBack}
        rightAction={
          isEditing && (
            <button
              onClick={handleDelete}
              className="p-2 text-white/80 hover:text-white hover:bg-rose-600/30 rounded-full transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )
        }
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7"
        >
          {/* Nome */}
          <TextInput
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Caixa transporte"
            required
            autoFocus
          />

          {/* Unidade e Quantidade base em grid lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Unidade"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="un"
              required
            />
            <TextInput
              label="Quantidade base"
              type="number"
              step="any"
              value={baseQuantity}
              onChange={(e) => setBaseQuantity(e.target.value)}
              placeholder="10,00"
              required
            />
          </div>

          {/* Custo total (R$) */}
          <TextInput
            label="Custo total (R$)"
            type="number"
            step="0.01"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            placeholder="R$ 50,00"
            helpText="Custo pago pela quantidade base acima."
            required
          />

          {/* Custo por unidade badge / card */}
          <div className="p-4 bg-[#FFF1E8] rounded-2xl flex items-center justify-between shadow-sm">
            <span className="text-sm font-medium text-[#543015]">
              Custo por unidade ({unit || 'un'})
            </span>
            <span className="text-base font-bold text-[#845025]">{formatCurrency(unitCost)}</span>
          </div>

          {/* Controlar estoque card */}
          <div className="p-4 bg-white rounded-2xl border border-[#EADDE2] shadow-xs space-y-3">
            <Switch
              label="Controlar estoque"
              sublabel="Quando ligado, o app desconta da quantidade ao usar em vendas."
              checked={trackStock}
              onChange={setTrackStock}
            />

            {trackStock && (
              <div className="pt-2 animate-fadeIn border-t border-[#EFE8DE]">
                <TextInput
                  label="Quantidade em estoque"
                  type="number"
                  step="any"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="10,00"
                  required
                />
              </div>
            )}
          </div>

          {/* Botão Salvar alterações */}
          <div className="pt-3">
            <Button type="submit" fullWidth size="lg">
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
