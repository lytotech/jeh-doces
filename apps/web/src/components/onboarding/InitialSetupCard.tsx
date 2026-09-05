import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  CakeSlice,
  Check,
  ChevronRight,
  ClipboardList,
  Package,
  Sparkles,
  Users,
  Wheat,
  X,
} from 'lucide-react';

interface InitialSetupCardProps {
  onNewOrder: () => void;
  onOpenSettings: () => void;
}

const exampleProducts = [
  {
    name: 'Brigadeiro gourmet',
    category: 'Doces',
    description: 'Brigadeiro cremoso para festas e encomendas',
    icon: '🍫',
    salePrice: 3.5,
  },
  {
    name: 'Bolo caseiro',
    category: 'Bolos Caseiros',
    description: 'Bolo caseiro personalizado para encomendas',
    icon: '🎂',
    salePrice: 45,
  },
  {
    name: 'Copo da felicidade',
    category: 'Sobremesas',
    description: 'Sobremesa montada em camadas',
    icon: '🍓',
    salePrice: 15,
  },
];

export const InitialSetupCard: React.FC<InitialSetupCardProps> = ({
  onNewOrder,
  onOpenSettings,
}) => {
  const { auth } = useAuth();
  const { setActiveTab, saveProductAction, showToast } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [addingExamples, setAddingExamples] = useState(false);

  const storageKey = `confeiti-initial-setup-dismissed:${auth?.activeCompanyId || 'default'}`;

  useEffect(() => {
    setDismissed(window.localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  if (dismissed) return null;

  const close = () => {
    window.localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  const addExampleProducts = async () => {
    setAddingExamples(true);
    try {
      for (const product of exampleProducts) {
        await saveProductAction(product);
      }
      showToast('Produtos de exemplo adicionados. Você pode editá-los no cardápio!');
    } finally {
      setAddingExamples(false);
    }
  };

  const steps = [
    {
      icon: Wheat,
      title: 'Cadastre seus ingredientes',
      description: 'Informe compras e custos para calcular o CMV.',
      action: () => setActiveTab('ingredients'),
    },
    {
      icon: Package,
      title: 'Adicione embalagens e materiais',
      description: 'Controle o estoque usado em cada encomenda.',
      action: () => setActiveTab('materials'),
    },
    {
      icon: CakeSlice,
      title: 'Monte seu cardápio',
      description: 'Crie produtos, receitas e preços de venda.',
      action: () => setActiveTab('products'),
    },
    {
      icon: Users,
      title: 'Cadastre seus clientes',
      description: 'Guarde contatos e endereços para agilizar pedidos.',
      action: () => setActiveTab('customers'),
    },
    {
      icon: ClipboardList,
      title: 'Crie sua primeira encomenda',
      description: 'Acompanhe prazo, produção, pagamentos e lucro.',
      action: onNewOrder,
    },
  ];

  return (
    <Card tone="cream" className="relative overflow-hidden border-[#D9B58D] p-5 sm:p-7">
      <button
        type="button"
        onClick={close}
        aria-label="Fechar guia inicial"
        className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8A7565] hover:bg-white/70"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="max-w-3xl">
        <div className="mb-2 flex items-center gap-2 text-[#96642F]">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.14em]">Primeiros passos</span>
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#4A3828] sm:text-3xl">
          Vamos preparar sua confeitaria?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7A6453]">
          Siga esta ordem para aproveitar melhor o Confeiti. Você pode pular qualquer etapa e
          voltar quando quiser.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {steps.map(({ icon: Icon, title, description, action }, index) => (
            <button
              key={title}
              type="button"
              onClick={action}
              className="group flex items-center gap-3 rounded-2xl border border-[#E7D5BF] bg-white/80 p-3 text-left transition-colors hover:bg-white"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7E5D3] text-[#96642F]">
                {index < 5 ? <Icon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#4A3828]">{title}</span>
                <span className="mt-0.5 block text-xs text-[#8A7565]">{description}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#B99A7B] transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button size="sm" onClick={addExampleProducts} disabled={addingExamples}>
            <CakeSlice className="h-4 w-4" />
            {addingExamples ? 'Adicionando...' : 'Começar com produtos de exemplo'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onOpenSettings}>
            Personalizar confeitaria
          </Button>
          <button type="button" onClick={close} className="text-xs font-semibold text-[#96642F] sm:ml-auto">
            Entendi, começar sozinho
          </button>
        </div>
      </div>
    </Card>
  );
};
