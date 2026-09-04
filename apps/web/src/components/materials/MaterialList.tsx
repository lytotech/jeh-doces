import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { TagBadge } from '../ui/Badge';
import { formatCurrency, formatDecimal } from '../../services/costEngine';
import { Plus, Search, Package, AlertTriangle, ChevronRight } from 'lucide-react';
import { Material } from '../../types';

interface MaterialListProps {
  onSelectMaterial: (material: Material) => void;
  onNewMaterial: () => void;
}

export const MaterialList: React.FC<MaterialListProps> = ({ onSelectMaterial, onNewMaterial }) => {
  const { materials } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = [
    'Todos',
    ...Array.from(new Set(materials.map((mat) => mat.category || 'Geral'))).sort((a, b) =>
      a.localeCompare(b),
    ),
  ];

  const filtered = materials.filter((mat) => {
    const category = mat.category || 'Geral';
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      mat.name.toLowerCase().includes(term) || category.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'Todos' || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title="Materiais & Embalagens"
        rightAction={
          <Button size="sm" onClick={onNewMaterial} className="shadow-none font-semibold">
            <Plus className="w-4 h-4" /> Novo Material
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Busca e categorias */}
        <div className="flex flex-col gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A89484] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar material, embalagem ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm font-medium text-[#302116] placeholder-[#B0A294] transition-colors shadow-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'border-[#96642F] bg-[#96642F] text-white'
                    : 'border-[#E5DACD] bg-white text-[#7A6453] hover:border-[#D7BC9B] hover:text-[#96642F]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#7A6453]">
            <span>{filtered.length} materiais encontrados</span>
          </div>
        </div>

        {/* List of Materials in responsive grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E5DACD] p-8 max-w-md mx-auto">
            <Package className="w-12 h-12 text-[#D7BC9B] mx-auto mb-3" />
            <p className="font-serif text-xl font-medium text-[#4A3828]">
              Nenhum material cadastrado
            </p>
            <p className="text-xs text-[#8A7565] mt-1.5 mb-5">
              Cadastre caixas, fitas, sacolas e embalagens para controlar custos e estoque.
            </p>
            <Button size="md" onClick={onNewMaterial}>
              <Plus className="w-4 h-4" /> Cadastrar Material
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mat) => {
              const isLowStock = mat.trackStock && mat.stockQuantity <= (mat.minStockAlert || 5);
              return (
                <div
                  key={mat.id}
                  onClick={() => onSelectMaterial(mat)}
                  className="bg-white hover:bg-[#FAF6F0] p-4 sm:p-5 rounded-3xl border border-[#E5DACD] hover:border-[#D7BC9B] shadow-xs hover:shadow-card cursor-pointer transition-all flex items-center justify-between active:scale-[0.99] group"
                >
                  <div className="space-y-1.5 flex-1 pr-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base text-[#302116] group-hover:text-[#96642F] transition-colors truncate">
                        {mat.name}
                      </span>
                      <TagBadge variant="material">{mat.category || 'Geral'}</TagBadge>
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Estoque baixo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#7A6453]">
                      <span>
                        Base: {formatDecimal(mat.baseQuantity)} {mat.unit} (
                        {formatCurrency(mat.totalCost)})
                      </span>
                      {mat.trackStock && (
                        <>
                          <span>•</span>
                          <span className={isLowStock ? 'font-bold text-amber-800' : 'font-medium'}>
                            Estoque: {formatDecimal(mat.stockQuantity)} {mat.unit}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-[#7A6453] uppercase block">
                        Custo Unitário
                      </span>
                      <span className="text-base font-bold text-[#96642F]">
                        {formatCurrency(mat.unitCost)}
                        <span className="text-xs font-normal text-[#7A6453]">/{mat.unit}</span>
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#C4B2A0] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
