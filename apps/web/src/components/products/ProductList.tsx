import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { TagBadge } from '../ui/Badge';
import { formatCurrency, formatDecimal } from '../../services/costEngine';
import { Plus, Search, Cake, ChevronRight, Copy } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { CategoryManager } from '../catalog/CategoryManager';

interface ProductListProps {
  onSelectProduct: (product: Product) => void;
  onNewProduct: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onSelectProduct, onNewProduct }) => {
  const { products, saveProductAction } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [persistedCategories, setPersistedCategories] = useState<string[]>([]);

  useEffect(() => {
    void api.getCatalogCategories('product').then((items) => setPersistedCategories(items.map((item) => item.name))).catch(() => undefined);
  }, [products.length]);

  const categories = ['todos', ...Array.from(new Set([
    ...persistedCategories,
    ...products.map((p) => p.category || 'Geral'),
  ]))];

  const filtered = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.category && prod.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'todos' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDuplicate = async (event: React.MouseEvent, product: Product) => {
    event.stopPropagation();
    await saveProductAction({
      name: `Cópia de ${product.name}`,
      category: product.category,
      description: product.description,
      icon: product.icon,
      salePrice: product.salePrice,
      calculatedCost: product.calculatedCost,
      profitMargin: product.profitMargin,
      ingredients: product.ingredients.map((ingredient) => ({ ...ingredient })),
      materials: product.materials.map((material) => ({ ...material })),
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title="Cardápio & Receitas"
        rightAction={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setCategoryManagerOpen(true)}>
              Categorias
            </Button>
            <Button size="sm" onClick={onNewProduct} className="!bg-[#6B1F3B] font-semibold shadow-md ring-1 ring-white/30 hover:!bg-[#54172F]">
              <Plus className="w-4 h-4" /> Novo Produto
            </Button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Search & Categories */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A89484] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por doce ou receita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm font-medium text-[#302116] placeholder-[#B0A294] transition-colors shadow-xs"
            />
          </div>

          {/* Category Pills */}
          {categories.length > 2 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#96642F] text-white shadow-xs'
                      : 'bg-white text-[#7A6453] border border-[#E5DACD] hover:bg-[#F6ECE0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center justify-between text-xs text-[#7A6453] px-1">
          <span>{filtered.length} doces e receitas</span>
          <span>Fichas técnicas com cálculo de CMV em tempo real</span>
        </div>

        {/* List of Products in responsive grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E5DACD] p-8 max-w-md mx-auto">
            <Cake className="w-12 h-12 text-[#D7BC9B] mx-auto mb-3" />
            <p className="font-serif text-xl font-medium text-[#4A3828]">
              Nenhum produto cadastrado
            </p>
            <p className="text-xs text-[#8A7565] mt-1.5 mb-5">
              Monte suas receitas com custos automáticos de ingredientes e embalagens.
            </p>
            <Button size="md" onClick={onNewProduct}>
              <Plus className="w-4 h-4" /> Cadastrar Produto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((prod) => {
              const profit = prod.salePrice - prod.calculatedCost;
              const margin = prod.salePrice > 0 ? (profit / prod.salePrice) * 100 : 0;
              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="bg-white hover:bg-white p-4 sm:p-5 rounded-3xl border border-[#E5DACD] hover:border-[#E5DACD] shadow-xs hover:shadow-card cursor-pointer transition-shadow flex items-center justify-between active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-3 flex-1 pr-2 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#F6EFE6] border border-[#E8DACB] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {prod.icon || '🧁'}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base text-[#302116] truncate">
                          {prod.name}
                        </span>
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
                    <button
                      type="button"
                      title={`Duplicar ${prod.name}`}
                      aria-label={`Duplicar ${prod.name}`}
                      onClick={(event) => void handleDuplicate(event, prod)}
                      className="rounded-xl p-2 text-[#8C7665] transition-colors hover:bg-[#F7E5EA] hover:text-[#8D3157]"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-[#C4B2A0] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <CategoryManager isOpen={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} initialType="product" />
    </div>
  );
};
