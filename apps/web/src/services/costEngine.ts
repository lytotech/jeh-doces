import { Ingredient, Material, Product, OrderStatus } from '../types';

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDecimal = (value: number | undefined | null, decimals = 2): string => {
  if (value === undefined || value === null || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const parseLocaleNumber = (str: string): number => {
  if (!str) return 0;
  const cleaned = str
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatDateTime = (dateStr: string | undefined): string => {
  if (!dateStr) return '--/--/---- --:--';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
};

export const formatDateOnly = (dateStr: string | undefined): string => {
  if (!dateStr) return '--/--/----';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

export const calculateIngredientUnitCost = (
  paidPrice: number,
  packageQuantity: number,
  isComposite: boolean,
  subIngredients?: { ingredientId: string; quantity: number }[],
  allIngredients: Ingredient[] = [],
  yieldQuantity = 1,
): number => {
  if (isComposite && subIngredients && subIngredients.length > 0) {
    let totalSubCost = 0;
    for (const sub of subIngredients) {
      const found = allIngredients.find((i) => i.id === sub.ingredientId);
      if (found) {
        totalSubCost += sub.quantity * (found.unitCost || 0);
      }
    }
    const yQty = yieldQuantity > 0 ? yieldQuantity : 1;
    return totalSubCost / yQty;
  }

  if (packageQuantity <= 0) return 0;
  return paidPrice / packageQuantity;
};

export const calculateMaterialUnitCost = (totalCost: number, baseQuantity: number): number => {
  if (baseQuantity <= 0) return 0;
  return totalCost / baseQuantity;
};

export const calculateProductCost = (
  product: Product,
  ingredients: Ingredient[],
  materials: Material[],
): number => {
  let cost = 0;

  // Ingredients cost
  if (product.ingredients && product.ingredients.length > 0) {
    for (const item of product.ingredients) {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        cost += item.quantity * (ing.unitCost || 0);
      }
    }
  }

  // Materials cost
  if (product.materials && product.materials.length > 0) {
    for (const item of product.materials) {
      const mat = materials.find((m) => m.id === item.materialId);
      if (mat) {
        cost += item.quantity * (mat.unitCost || 0);
      }
    }
  }

  return Number(cost.toFixed(2));
};

export interface OrderStatusConfig {
  label: string;
  stepNumber: number;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig> = {
  orcamento: {
    label: 'Orçamento',
    stepNumber: 1,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    accentColor: '#B57E44',
  },
  confirmado: {
    label: 'Confirmado',
    stepNumber: 2,
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    accentColor: '#3B82F6',
  },
  produzindo: {
    label: 'Produzindo',
    stepNumber: 3,
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    accentColor: '#8B5CF6',
  },
  pronto: {
    label: 'Pronto',
    stepNumber: 4,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    accentColor: '#10B981',
  },
  entregue: {
    label: 'Entregue',
    stepNumber: 5,
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
    accentColor: '#059669',
  },
  cancelado: {
    label: 'Cancelado',
    stepNumber: 0,
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    accentColor: '#E11D48',
  },
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'orcamento',
  'confirmado',
  'produzindo',
  'pronto',
  'entregue',
];
