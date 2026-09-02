import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { TagBadge } from '../ui/Badge';
import { formatCurrency, formatDecimal } from '../../services/costEngine';
import { Plus, Search, Cake, ChevronRight, TrendingUp } from 'lucide-react';
import { Product } from '../../types';

interface ProductListProps {
  onSelectProduct: (product: Product) => void;
  onNewProduct: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onSelectProduct,
  onNewProduct,
}) => {
  const { products } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const categories = ['todos', ...Array.from(new Set(products.map((p) => p.category || 'Geral')))];

  const filtered = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.category && prod.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'todos' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <AppHeader
        title="Cardápio & Receitas"
        rightAction={
          <Button size="sm" onClick={onNewProduct} className="shadow-none">
            <Plus className="w-4 h-4" /> Novo
          </Button>
        }
      />

      <div className="max-w-md mx-auto p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A89484] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por doce ou receita..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm font-medium text-[#302116] placeholder-[#B0A294] transition-colors"
          />
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#96642F] text-white'
                    : 'bg-white text-[#7A6453] border border-[#E5DACD] hover:bg-[#F6ECE0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        <div className="flex items-center justify-between text-xs text-[#7A6453] px-1">
          <span>{filtered.length} doces e receitas</span>
          <span>Ficha técnica com CMV</span>
        </div>

        {/* List of Products */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#E5DACD] p-6">
              <Cake className="w-12 h-12 text-[#D7BC9B] mx-auto mb-2" />
              <p className="font-serif text-lg font-medium text-[#4A3828]">Nenhum produto cadastrado</p>
              <p className="text-xs text-[#8A7565] mt-1 mb-4">
                Monte suas receitas com custos automáticos de ingredientes e embalagens.
              </p>
              <Button size="sm" onClick={onNewProduct}>
                <Plus className="w-4 h-4" /> Cadastrar Produto
              </Button>
            </div>
          ) : (
            filtered.map((prod) => {
              const profit = prod.salePrice - prod.calculatedCost;
              const margin = prod.salePrice > 0 ? (profit / prod.salePrice) * 100 : 0;
              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="bg-white hover:bg-[#FAF6F0] p-4 rounded-2xl border border-[#E5DACD] shadow-xs cursor-pointer transition-all flex items-center justify-between active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 flex-1 pr-2">
                    <div className="w-11 h-11 rounded-2xl bg-[#F6EFE6] border border-[#E8DACB] flex items-center justify-center text-xl shrink-0">
                      {prod.icon || '🧁'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base text-[#302116]">{prod.name}</span>
                        {prod.category && <TagBadge>{prod.category}</TagBadge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#7A6453]">
                        <span>Custo: {formatCurrency(prod.calculatedCost)}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">
                          Margem: {formatDecimal(margin, 0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-[#7A6453] uppercase block">Preço</span>
                      <span className="text-base font-bold text-[#302116]">
                        {formatCurrency(prod.salePrice)}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#C4B2A0]" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
