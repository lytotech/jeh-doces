export type IngredientUnit = 'g' | 'ml' | 'un';
export type MaterialUnit = 'un' | 'pct' | 'm' | 'cx' | 'folha' | 'rolo';

export interface PriceHistoryRecord {
  id: string;
  date: string; // ISO string (e.g. 2026-09-01T19:00:00Z)
  paidPrice: number;
  packageQuantity: number;
  unitCost: number;
  notes?: string;
}

export interface SubIngredientItem {
  id: string;
  ingredientId: string;
  quantity: number; // in the ingredient's unit
}

export interface Ingredient {
  id: string;
  name: string;
  isComposite: boolean;
  unit: IngredientUnit;
  packageQuantity: number; // e.g. 500
  paidPrice: number; // e.g. 50.00
  unitCost: number; // calculated: paidPrice / packageQuantity (e.g. 0.10)
  subIngredients?: SubIngredientItem[];
  yieldQuantity?: number; // if composite, how much it yields (in grams/ml/un)
  priceHistory: PriceHistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string; // e.g. 'un'
  baseQuantity: number; // e.g. 10.00
  totalCost: number; // e.g. 50.00
  unitCost: number; // calculated: totalCost / baseQuantity (e.g. 5.00)
  trackStock: boolean;
  stockQuantity: number; // e.g. 10.00
  minStockAlert?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  materialId: string;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  createdAt: string;
}

export interface ProductIngredient {
  ingredientId: string;
  quantity: number; // in ingredient unit
}

export interface ProductMaterial {
  materialId: string;
  quantity: number; // in material unit
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  icon?: string; // emoji or icon name
  salePrice: number; // e.g. 12.50
  ingredients: ProductIngredient[];
  materials: ProductMaterial[];
  calculatedCost: number; // calculated from ingredients + materials
  profitMargin?: number; // target percentage
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  'orcamento' | 'confirmado' | 'produzindo' | 'pronto' | 'entregue' | 'cancelado';

export interface OrderProductItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitCost: number;
  totalCost: number;
}

export interface OrderMaterialItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export type PaymentMethod =
  'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'outro';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  customerId?: string;
  shareToken?: string;
  deliveryDate: string; // e.g. "2026-08-25T08:00"
  status: OrderStatus;
  items: OrderProductItem[];
  materials: OrderMaterialItem[];
  subtotal: number;
  discount: number;
  totalCharged: number;
  estimatedCost: number;
  estimatedProfit: number;
  profitMarginPercent: number;
  payments: PaymentRecord[];
  notes?: string;
  stockDecremented?: boolean; // track if inventory was deducted
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commitment {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  storeName: string;
  storePhone: string;
  pixKey: string;
  pixKeyType: string;
  defaultProfitMargin: number;
  currencySymbol: string;
}

export interface DatabaseSchema {
  version: string;
  updatedAt: string;
  ingredients: Ingredient[];
  materials: Material[];
  products: Product[];
  orders: Order[];
  stockMovements?: StockMovement[];
  settings: AppSettings;
}
