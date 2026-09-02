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

export const MaterialList: React.FC<MaterialListProps> = ({
  onSelectMaterial,
  onNewMaterial,
}) => {
  const { materials, adjustMaterialStockAction } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = materials.filter((mat) =>
    mat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <AppHeader
        title="Materiais e Embalagens"
        rightAction={
          <Button size="sm" onClick={onNewMaterial} className="shadow-none">
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
            placeholder="Buscar material ou embalagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-sm font-medium text-[#302116] placeholder-[#B0A294] transition-colors"
          />
        </div>

        {/* Count */}
        <div className="flex items-center justify-between text-xs text-[#7A6453] px-1">
          <span>{filtered.length} materiais cadastrados</span>
          <span>Desconto automático em vendas</span>
        </div>

        {/* List of Materials */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#E5DACD] p-6">
              <Package className="w-12 h-12 text-[#D7BC9B] mx-auto mb-2" />
              <p className="font-serif text-lg font-medium text-[#4A3828]">Nenhum material cadastrado</p>
              <p className="text-xs text-[#8A7565] mt-1 mb-4">
                Cadastre caixas, fitas, sacolas e embalagens para controlar custos e estoque.
              </p>
              <Button size="sm" onClick={onNewMaterial}>
                <Plus className="w-4 h-4" /> Cadastrar Material
              </Button>
            </div>
          ) : (
            filtered.map((mat) => {
              const isLowStock = mat.trackStock && mat.stockQuantity <= (mat.minStockAlert || 5);
              return (
                <div
                  key={mat.id}
                  onClick={() => onSelectMaterial(mat)}
                  className="bg-white hover:bg-[#FAF6F0] p-4 rounded-2xl border border-[#E5DACD] shadow-xs cursor-pointer transition-all flex items-center justify-between active:scale-[0.99]"
                >
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base text-[#302116]">{mat.name}</span>
                      <TagBadge variant="material">Material</TagBadge>
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Estoque baixo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#7A6453]">
                      <span>
                        Base: {formatDecimal(mat.baseQuantity)} {mat.unit} ({formatCurrency(mat.totalCost)})
                      </span>
                      {mat.trackStock && (
                        <>
                          <span>•</span>
                          <span className={isLowStock ? 'font-bold text-amber-700' : 'font-medium'}>
                            Estoque: {formatDecimal(mat.stockQuantity)} {mat.unit}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-[#7A6453] uppercase block">Custo Unitário</span>
                      <span className="text-base font-bold text-[#96642F]">
                        {formatCurrency(mat.unitCost)}
                        <span className="text-xs font-normal text-[#7A6453]">/{mat.unit}</span>
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
