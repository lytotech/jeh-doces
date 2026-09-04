import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api, CatalogCategorySummary } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

type CategoryType = 'product' | 'material';

export const CategoryManager: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialType?: CategoryType;
}> = ({ isOpen, onClose, initialType = 'product' }) => {
  const { showToast } = useApp();
  const [type, setType] = useState<CategoryType>(initialType);
  const [categories, setCategories] = useState<CatalogCategorySummary[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      setCategories(await api.getCatalogCategories(type));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadCategories();
  }, [isOpen, type]);

  useEffect(() => {
    if (isOpen) setType(initialType);
  }, [isOpen, initialType]);

  const rename = async (name: string) => {
    const nextName = draft.trim();
    if (!nextName || nextName === name) {
      setEditing(null);
      return;
    }
    try {
      await api.renameCatalogCategory(type, name, nextName);
      showToast('Categoria renomeada com sucesso.');
      setEditing(null);
      await loadCategories();
    } catch {
      showToast('Não foi possível renomear a categoria.', 'error');
    }
  };

  const remove = async (name: string, itemCount: number) => {
    if (itemCount > 0) {
      showToast('Mova os itens antes de excluir esta categoria.', 'warning');
      return;
    }
    if (!window.confirm(`Excluir a categoria “${name}”?`)) return;
    try {
      await api.deleteCatalogCategory(type, name);
      showToast('Categoria excluída.', 'info');
      await loadCategories();
    } catch {
      showToast('Não foi possível excluir a categoria.', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar categorias" maxWidth="lg">
      <div className="space-y-4">
        <div className="flex gap-1 rounded-xl border border-[#E5DACD] bg-white p-1">
          {(['product', 'material'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${type === item ? 'bg-[#96642F] text-white' : 'text-[#7A6453]'}`}
            >
              {item === 'product' ? 'Produtos e Receitas' : 'Materiais e Estoque'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[#7A6453]">Carregando categorias...</p>
        ) : categories.length === 0 ? (
          <p className="rounded-2xl bg-[#FCFAF8] p-6 text-center text-sm text-[#7A6453]">
            Nenhuma categoria cadastrada.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center gap-2 rounded-2xl border border-[#E5DACD] bg-white p-3">
                {editing === category.name ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void rename(category.name);
                      if (event.key === 'Escape') setEditing(null);
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-[#D69A88] bg-[#FFFCF8] px-3 py-2 text-sm text-[#302116] outline-none"
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#302116]">{category.name}</p>
                    <p className="text-xs text-[#7A6453]">{category.itemCount} {category.itemCount === 1 ? 'item vinculado' : 'itens vinculados'}</p>
                  </div>
                )}
                {editing === category.name ? (
                  <Button size="sm" onClick={() => void rename(category.name)}>Salvar</Button>
                ) : (
                  <button type="button" title="Renomear categoria" onClick={() => { setEditing(category.name); setDraft(category.name); }} className="rounded-xl p-2 text-[#8C7665] hover:bg-[#F7E5EA] hover:text-[#8D3157]">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button type="button" title="Excluir categoria" onClick={() => void remove(category.name, category.itemCount)} className="rounded-xl p-2 text-[#8C7665] hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[#E5DACD] pt-3 text-xs text-[#7A6453]">
          <Plus className="h-4 w-4" /> Novas categorias são criadas ao salvar um produto ou material.
        </div>
      </div>
    </Modal>
  );
};
