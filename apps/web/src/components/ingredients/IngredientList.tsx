import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { TagBadge } from '../ui/Badge';
import { formatCurrency, formatDecimal } from '../../services/costEngine';
import { Plus, Search, Cookie, Sparkles, ChevronRight } from 'lucide-react';
import { Ingredient } from '../../types';

interface IngredientListProps {
  onSelectIngredient: (ingredient: Ingredient) => void;
  onNewIngredient: () => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({
  onSelectIngredient,
  onNewIngredient,
}) => {
  const { ingredients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title="Ingredientes & Insumos"
        rightAction={
          <Button size="sm" onClick={onNewIngredient} className="shadow-none font-semibold">
            <Plus className="w-4 h-4" /> Novo Ingrediente
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A89484] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm font-medium text-[#302116] placeholder-[#B0A294] transition-colors shadow-xs"
            />
          </div>

          <div className="text-xs text-[#7A6453]">
            <span>{filtered.length} ingredientes cadastrados</span>
          </div>
        </div>

        {/* Ingredients Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E5DACD] p-8 max-w-md mx-auto">
            <Cookie className="w-12 h-12 text-[#D7BC9B] mx-auto mb-3" />
            <p className="font-serif text-xl font-medium text-[#4A3828]">Nenhum ingrediente encontrado</p>
            <p className="text-xs text-[#8A7565] mt-1.5 mb-5">
              Cadastre seus insumos para calcular o custo exato das receitas.
            </p>
            <Button size="md" onClick={onNewIngredient}>
              <Plus className="w-4 h-4" /> Cadastrar Ingrediente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ing) => (
              <div
                key={ing.id}
                onClick={() => onSelectIngredient(ing)}
                className="bg-white hover:bg-[#FAF6F0] p-4 sm:p-5 rounded-3xl border border-[#E5DACD] hover:border-[#D7BC9B] shadow-xs hover:shadow-card cursor-pointer transition-all flex items-center justify-between active:scale-[0.99] group"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base text-[#302116] group-hover:text-[#96642F] transition-colors truncate">
                      {ing.name}
                    </span>
                    {ing.isComposite && (
                      <TagBadge variant="gold">
                        <Sparkles className="w-3 h-3 mr-1 inline" /> Composto
                      </TagBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#7A6453]">
                    <span>
                      {formatDecimal(ing.packageQuantity)} {ing.unit}
                    </span>
                    <span>•</span>
                    <span>Pago: {formatCurrency(ing.paidPrice)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-[#7A6453] uppercase block">Custo Unitário</span>
                    <span className="text-base font-bold text-[#96642F]">
                      {formatCurrency(ing.unitCost)}
                      <span className="text-xs font-normal text-[#7A6453]">/{ing.unit}</span>
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#C4B2A0] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
