import React, { useState, useMemo } from 'react';
import { Product, ProductIngredient, ProductMaterial } from '../../types';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { TextInput } from '../ui/Input';
import { Button } from '../ui/Button';
import { TagBadge } from '../ui/Badge';
import { formatCurrency, formatDecimal, calculateProductCost } from '../../services/costEngine';
import { Trash2, Plus, UtensilsCrossed, Package, DollarSign, Sparkles } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null;
  onBack: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onBack }) => {
  const { ingredients, materials, saveProductAction, deleteProductAction } = useApp();

  const isEditing = !!product?.id;

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Doces');
  const [description, setDescription] = useState(product?.description || '');
  const [icon, setIcon] = useState(product?.icon || '🧁');
  const [salePrice, setSalePrice] = useState(product ? product.salePrice.toString() : '0');
  const [recipeIngredients, setRecipeIngredients] = useState<ProductIngredient[]>(
    product?.ingredients || [],
  );
  const [recipeMaterials, setRecipeMaterials] = useState<ProductMaterial[]>(
    product?.materials || [],
  );

  const numericSalePrice = parseFloat(salePrice.replace(',', '.')) || 0;

  // Real-time cost calculation
  const calculatedCost = useMemo(() => {
    const tempProd: Product = {
      id: product?.id || 'temp',
      name,
      salePrice: numericSalePrice,
      ingredients: recipeIngredients,
      materials: recipeMaterials,
      calculatedCost: 0,
      createdAt: '',
      updatedAt: '',
    };
    return calculateProductCost(tempProd, ingredients, materials);
  }, [name, numericSalePrice, recipeIngredients, recipeMaterials, ingredients, materials]);

  const estimatedProfit = numericSalePrice - calculatedCost;
  const marginPercent = numericSalePrice > 0 ? (estimatedProfit / numericSalePrice) * 100 : 0;
  const markupPercent = calculatedCost > 0 ? (estimatedProfit / calculatedCost) * 100 : 0;

  // Ingredient list handlers
  const handleAddIngredient = () => {
    if (ingredients.length === 0) return;
    setRecipeIngredients([...recipeIngredients, { ingredientId: ingredients[0].id, quantity: 50 }]);
  };

  const handleUpdateIngredient = (
    index: number,
    field: 'ingredientId' | 'quantity',
    val: string | number,
  ) => {
    const updated = [...recipeIngredients];
    if (field === 'ingredientId') {
      updated[index].ingredientId = val as string;
    } else {
      updated[index].quantity = parseFloat(String(val).replace(',', '.')) || 0;
    }
    setRecipeIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  // Material list handlers
  const handleAddMaterial = () => {
    if (materials.length === 0) return;
    setRecipeMaterials([...recipeMaterials, { materialId: materials[0].id, quantity: 1 }]);
  };

  const handleUpdateMaterial = (
    index: number,
    field: 'materialId' | 'quantity',
    val: string | number,
  ) => {
    const updated = [...recipeMaterials];
    if (field === 'materialId') {
      updated[index].materialId = val as string;
    } else {
      updated[index].quantity = parseFloat(String(val).replace(',', '.')) || 0;
    }
    setRecipeMaterials(updated);
  };

  const handleRemoveMaterial = (index: number) => {
    setRecipeMaterials(recipeMaterials.filter((_, i) => i !== index));
  };

  const handleApplySuggestedPrice = (targetMarkup: number) => {
    const suggested = calculatedCost * (1 + targetMarkup / 100);
    setSalePrice(suggested.toFixed(2));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveProductAction({
      id: product?.id,
      name: name.trim(),
      category: category.trim() || 'Doces',
      description: description.trim(),
      icon,
      salePrice: numericSalePrice,
      calculatedCost,
      profitMargin: markupPercent,
      ingredients: recipeIngredients,
      materials: recipeMaterials,
    });

    onBack();
  };

  const handleDelete = () => {
    if (product?.id && confirm('Deseja realmente remover este produto?')) {
      deleteProductAction(product.id);
      onBack();
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAF7F2] pb-24">
      <AppHeader
        title={isEditing ? 'Editar produto' : 'Novo produto'}
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

      <div className="w-full max-w-md mx-auto p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Nome e Ícone */}
          <div className="flex gap-2">
            <div className="w-16">
              <TextInput
                label="Ícone"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="text-center text-xl"
              />
            </div>
            <div className="flex-1">
              <TextInput
                label="Nome do produto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Barrinha prestígio"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Categoria */}
          <TextInput
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Barrinhas Recheadas, Bolos, Doces"
          />

          {/* Ingredientes da Receita */}
          <div className="p-4 bg-[#FCFAF8] rounded-2xl border border-[#E5DACD] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#96642F]" /> Ingredientes da Receita
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddIngredient}>
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>

            {recipeIngredients.length === 0 ? (
              <p className="text-xs text-center py-2 text-[#8A7565]">
                Nenhum ingrediente vinculado a este produto.
              </p>
            ) : (
              <div className="space-y-2">
                {recipeIngredients.map((item, index) => {
                  const ing = ingredients.find((i) => i.id === item.ingredientId);
                  const itemCost = (ing?.unitCost || 0) * item.quantity;
                  return (
                    <div
                      key={index}
                      className="bg-white p-2.5 rounded-xl border border-[#E5DACD] flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0"
                    >
                      <select
                        className="w-full sm:flex-1 min-w-0 bg-transparent text-xs font-semibold text-[#302116] border-none focus:outline-none truncate"
                        value={item.ingredientId}
                        onChange={(e) =>
                          handleUpdateIngredient(index, 'ingredientId', e.target.value)
                        }
                      >
                        {ingredients.map((opt) => (
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
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateIngredient(index, 'quantity', e.target.value)
                          }
                        />
                        <span className="text-[11px] text-[#7A6453] w-6">{ing?.unit || 'g'}</span>
                      </div>
                      <span className="text-xs font-bold text-[#96642F] w-14 text-right">
                        {formatCurrency(itemCost)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-1 text-[#A89484] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Embalagens e Materiais Padrão */}
          <div className="p-4 bg-[#FCFAF8] rounded-2xl border border-[#E5DACD] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#96642F]" /> Embalagens & Materiais
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddMaterial}>
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>

            {recipeMaterials.length === 0 ? (
              <p className="text-xs text-center py-2 text-[#8A7565]">
                Nenhuma embalagem padrão vinculada.
              </p>
            ) : (
              <div className="space-y-2">
                {recipeMaterials.map((item, index) => {
                  const mat = materials.find((m) => m.id === item.materialId);
                  const matCost = (mat?.unitCost || 0) * item.quantity;
                  return (
                    <div
                      key={index}
                      className="bg-white p-2.5 rounded-xl border border-[#E5DACD] flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0"
                    >
                      <select
                        className="w-full sm:flex-1 min-w-0 bg-transparent text-xs font-semibold text-[#302116] border-none focus:outline-none truncate"
                        value={item.materialId}
                        onChange={(e) => handleUpdateMaterial(index, 'materialId', e.target.value)}
                      >
                        {materials.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} ({formatCurrency(opt.unitCost)}/{opt.unit})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          className="w-14 px-1.5 py-1 text-xs font-bold text-right bg-[#FAF7F2] border border-[#DFCFC0] rounded-lg focus:outline-none"
                          value={item.quantity}
                          onChange={(e) => handleUpdateMaterial(index, 'quantity', e.target.value)}
                        />
                        <span className="text-[11px] text-[#7A6453] w-6">{mat?.unit || 'un'}</span>
                      </div>
                      <span className="text-xs font-bold text-[#96642F] w-14 text-right">
                        {formatCurrency(matCost)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(index)}
                        className="p-1 text-[#A89484] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumo de Custo & Margem */}
          <div className="p-4 bg-[#F5ECE0] border border-[#E7D5BF] rounded-2xl space-y-2.5 shadow-xs">
            <div className="flex justify-between items-center text-sm font-semibold text-[#543015]">
              <span>Custo total estimado (CMV):</span>
              <span className="text-base text-[#96642F]">{formatCurrency(calculatedCost)}</span>
            </div>

            {/* Sugestões de Markup */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-[#7A4B1D] font-medium">Margens:</span>
              <button
                type="button"
                onClick={() => handleApplySuggestedPrice(100)}
                className="text-[11px] px-2 py-1 bg-white hover:bg-amber-50 rounded-lg border border-[#D7BC9B] font-semibold text-[#845025]"
              >
                +100% ({formatCurrency(calculatedCost * 2)})
              </button>
              <button
                type="button"
                onClick={() => handleApplySuggestedPrice(150)}
                className="text-[11px] px-2 py-1 bg-white hover:bg-amber-50 rounded-lg border border-[#D7BC9B] font-semibold text-[#845025]"
              >
                +150% ({formatCurrency(calculatedCost * 2.5)})
              </button>
              <button
                type="button"
                onClick={() => handleApplySuggestedPrice(200)}
                className="text-[11px] px-2 py-1 bg-white hover:bg-amber-50 rounded-lg border border-[#D7BC9B] font-semibold text-[#845025]"
              >
                +200% ({formatCurrency(calculatedCost * 3)})
              </button>
            </div>
          </div>

          {/* Preço de Venda (R$) */}
          <TextInput
            label="Preço de venda (R$)"
            type="number"
            step="0.01"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="12,50"
            required
          />

          {/* Lucro e Margem resultantes */}
          {numericSalePrice > 0 && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-2xl border border-[#E5DACD] text-center">
              <div>
                <span className="text-[11px] text-[#7A6453] uppercase font-bold block">
                  Lucro Bruto
                </span>
                <span
                  className={`text-base font-bold ${estimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  {formatCurrency(estimatedProfit)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#7A6453] uppercase font-bold block">
                  Margem Líquida
                </span>
                <span
                  className={`text-base font-bold ${marginPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  {formatDecimal(marginPercent, 1)}%
                </span>
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          <div className="pt-2">
            <Button type="submit" fullWidth size="lg">
              Salvar produto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
