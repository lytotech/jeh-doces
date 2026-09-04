import React, { useState, useMemo } from 'react';
import { Ingredient, IngredientUnit, SubIngredientItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { TextInput, Switch } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { PriceHistoryModal } from './PriceHistoryModal';
import { formatCurrency, calculateIngredientUnitCost } from '../../services/costEngine';
import { TrendingUp, Trash2, Plus } from 'lucide-react';

interface IngredientFormProps {
  ingredient?: Ingredient | null;
  onBack: () => void;
}

export const IngredientForm: React.FC<IngredientFormProps> = ({ ingredient, onBack }) => {
  const { ingredients, saveIngredientAction, deleteIngredientAction } = useApp();

  const isEditing = !!ingredient?.id;

  const [name, setName] = useState(ingredient?.name || '');
  const [isComposite, setIsComposite] = useState(ingredient?.isComposite || false);
  const [unit, setUnit] = useState<IngredientUnit>(ingredient?.unit || 'g');
  const [packageQuantity, setPackageQuantity] = useState(
    ingredient ? ingredient.packageQuantity.toString() : '1000',
  );
  const [paidPrice, setPaidPrice] = useState(ingredient ? ingredient.paidPrice.toString() : '0');
  const [yieldQuantity, setYieldQuantity] = useState(
    ingredient?.yieldQuantity ? ingredient.yieldQuantity.toString() : '600',
  );
  const [subIngredients, setSubIngredients] = useState<SubIngredientItem[]>(
    ingredient?.subIngredients || [],
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Available ingredients for composite recipe (excluding self)
  const availableSubIngredients = useMemo(() => {
    return ingredients.filter((i) => i.id !== ingredient?.id && !i.isComposite);
  }, [ingredients, ingredient?.id]);

  // Calculate unit cost in real time
  const numericPaidPrice = parseFloat(paidPrice.replace(',', '.')) || 0;
  const numericPackageQty = parseFloat(packageQuantity.replace(',', '.')) || 1;
  const numericYieldQty = parseFloat(yieldQuantity.replace(',', '.')) || 1;

  const computedUnitCost = useMemo(() => {
    return calculateIngredientUnitCost(
      numericPaidPrice,
      numericPackageQty,
      isComposite,
      subIngredients,
      ingredients,
      numericYieldQty,
    );
  }, [
    numericPaidPrice,
    numericPackageQty,
    isComposite,
    subIngredients,
    ingredients,
    numericYieldQty,
  ]);

  // Sub-ingredient handlers
  const handleAddSubIngredient = () => {
    if (availableSubIngredients.length === 0) return;
    const defaultIng = availableSubIngredients[0];
    setSubIngredients([
      ...subIngredients,
      {
        id: `sub-${Date.now()}`,
        ingredientId: defaultIng.id,
        quantity: 100,
      },
    ]);
  };

  const handleUpdateSubIngredient = (
    index: number,
    field: 'ingredientId' | 'quantity',
    val: string | number,
  ) => {
    const updated = [...subIngredients];
    if (field === 'ingredientId') {
      updated[index].ingredientId = val as string;
    } else {
      updated[index].quantity = parseFloat(String(val).replace(',', '.')) || 0;
    }
    setSubIngredients(updated);
  };

  const handleRemoveSubIngredient = (index: number) => {
    setSubIngredients(subIngredients.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await saveIngredientAction({
        id: ingredient?.id,
        name: name.trim(),
        isComposite,
        unit,
        packageQuantity: numericPackageQty,
        paidPrice: isComposite ? computedUnitCost * numericYieldQty : numericPaidPrice,
        unitCost: computedUnitCost,
        yieldQuantity: isComposite ? numericYieldQty : undefined,
        subIngredients: isComposite ? subIngredients : [],
      });
      onBack();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (ingredient?.id) {
      deleteIngredientAction(ingredient.id);
      setShowDeleteConfirm(false);
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title={isEditing ? 'Editar ingrediente' : 'Novo ingrediente'}
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

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column (col-span-7) */}
          <div className="md:col-span-7 space-y-4">
            {/* Nome */}
            <TextInput
              label="Nome do ingrediente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: chocolate em pó"
              required
              autoFocus
            />

            {/* É composto de outros ingredientes */}
            <div className="bg-[#FCFAF8] p-4 border border-[#E5DACD] rounded-3xl shadow-xs">
              <Switch
                label="É composto de outros ingredientes"
                sublabel="Ative para receitas bases como brigadeiro, ganache ou geleias"
                checked={isComposite}
                onChange={setIsComposite}
              />
            </div>

            {/* If composite, show sub-recipe ingredient builder */}
            {isComposite && (
              <div className="p-5 bg-[#F5EFE6] rounded-3xl border border-[#DFCFC0] space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider">
                    Ingredientes da Composição
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleAddSubIngredient}
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>

                {subIngredients.length === 0 ? (
                  <p className="text-xs text-center py-3 text-[#8A7565]">
                    Nenhum ingrediente adicionado. Clique acima para compor a receita.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subIngredients.map((sub, index) => {
                      const ing = ingredients.find((i) => i.id === sub.ingredientId);
                      const subCost = (ing?.unitCost || 0) * sub.quantity;
                      return (
                        <div
                          key={sub.id || index}
                          className="bg-white p-2.5 rounded-2xl border border-[#E5DACD] flex items-center gap-2"
                        >
                          <select
                            className="flex-1 bg-transparent text-xs font-semibold text-[#302116] border-none focus:outline-none"
                            value={sub.ingredientId}
                            onChange={(e) =>
                              handleUpdateSubIngredient(index, 'ingredientId', e.target.value)
                            }
                          >
                            {availableSubIngredients.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({formatCurrency(opt.unitCost)}/{opt.unit})
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              className="w-16 px-1.5 py-1 text-xs font-bold text-right bg-[#FAF7F2] border border-[#DFCFC0] rounded-lg focus:outline-none"
                              value={sub.quantity}
                              onChange={(e) =>
                                handleUpdateSubIngredient(index, 'quantity', e.target.value)
                              }
                            />
                            <span className="text-[11px] text-[#7A6453] w-6">
                              {ing?.unit || 'g'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#96642F] w-16 text-right">
                            {formatCurrency(subCost)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubIngredient(index)}
                            className="p-1 text-[#A89484] hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <TextInput
                  label={`Rendimento Total da Receita (${unit})`}
                  type="number"
                  step="any"
                  value={yieldQuantity}
                  onChange={(e) => setYieldQuantity(e.target.value)}
                  helpText="Quantidade final produzida por esta receita base"
                />
              </div>
            )}
          </div>

          {/* Right Column (col-span-5) */}
          <div className="md:col-span-5 space-y-4">
            {/* Unidade: g, ml, un */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#7A6453] px-1">
                Unidade de Medida
              </label>
              <SegmentedControl
                options={[
                  { value: 'g', label: 'g (gramas)' },
                  { value: 'ml', label: 'ml (mililitros)' },
                  { value: 'un', label: 'un (unidades)' },
                ]}
                value={unit}
                onChange={setUnit}
              />
            </div>

            {/* Quantidade e Valor Pago */}
            {!isComposite && (
              <div className="space-y-3">
                <TextInput
                  label="Quantidade por Embalagem"
                  type="number"
                  step="any"
                  value={packageQuantity}
                  onChange={(e) => setPackageQuantity(e.target.value)}
                  placeholder="500,00"
                  required
                />

                <TextInput
                  label="Valor pago pelo pacote (R$)"
                  type="number"
                  step="0.01"
                  value={paidPrice}
                  onChange={(e) => setPaidPrice(e.target.value)}
                  placeholder="50,00"
                  required
                />
              </div>
            )}

            {/* Calculated unit cost banner */}
            <div className="p-5 bg-[#FAF5EE] border border-[#E7D5BF] rounded-3xl space-y-1 shadow-xs">
              <span className="text-xs font-semibold text-[#7A4B1D] uppercase tracking-wide block">
                Custo Calculado por {unit}
              </span>
              <span className="text-2xl font-bold text-[#96642F] block">
                {formatCurrency(computedUnitCost)}{' '}
                <span className="text-sm font-normal text-[#7A4B1D]">/ {unit}</span>
              </span>
            </div>

            {/* Botão Salvar */}
            <Button
              disabled={saving}
              type="submit"
              fullWidth
              size="lg"
              className="py-4 font-bold shadow-md"
            >
              {saving ? 'Salvando…' : 'Salvar Ingrediente'}
            </Button>

            {/* Botão Histórico de Preço */}
            {isEditing && ingredient && (
              <Button
                type="button"
                variant="caramel-outline"
                fullWidth
                size="lg"
                onClick={() => setShowHistoryModal(true)}
                className="border-[1.5px] border-[#96642F] bg-[#FCFAF8] py-3.5"
              >
                <TrendingUp className="w-5 h-5 mr-2 stroke-[2.2]" /> Ver Histórico de Preços
              </Button>
            )}
          </div>
        </form>
      </div>

      {ingredient && showHistoryModal && (
        <PriceHistoryModal
          ingredient={ingredient}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Excluir ingrediente"
        message="Tem certeza que deseja excluir este ingrediente? Essa ação não poderá ser desfeita."
        confirmLabel="Excluir ingrediente"
        onConfirm={handleDelete}
      />
    </div>
  );
};
