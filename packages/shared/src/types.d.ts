export type IngredientUnit = 'g' | 'ml' | 'un';
export type MaterialUnit = 'un' | 'pct' | 'm' | 'cx' | 'folha' | 'rolo';
export interface PriceHistoryRecord {
    id: string;
    date: string;
    paidPrice: number;
    packageQuantity: number;
    unitCost: number;
    notes?: string;
}
export interface SubIngredientItem {
    id: string;
    ingredientId: string;
    quantity: number;
}
export interface Ingredient {
    id: string;
    name: string;
    isComposite: boolean;
    unit: IngredientUnit;
    packageQuantity: number;
    paidPrice: number;
    unitCost: number;
    subIngredients?: SubIngredientItem[];
    yieldQuantity?: number;
    priceHistory: PriceHistoryRecord[];
    createdAt: string;
    updatedAt: string;
}
export interface Material {
    id: string;
    name: string;
    unit: string;
    baseQuantity: number;
    totalCost: number;
    unitCost: number;
    trackStock: boolean;
    stockQuantity: number;
    minStockAlert?: number;
    createdAt: string;
    updatedAt: string;
}
export interface ProductIngredient {
    ingredientId: string;
    quantity: number;
}
export interface ProductMaterial {
    materialId: string;
    quantity: number;
}
export interface Product {
    id: string;
    name: string;
    category?: string;
    description?: string;
    icon?: string;
    salePrice: number;
    ingredients: ProductIngredient[];
    materials: ProductMaterial[];
    calculatedCost: number;
    profitMargin?: number;
    createdAt: string;
    updatedAt: string;
}
export type OrderStatus = 'orcamento' | 'confirmado' | 'produzindo' | 'pronto' | 'entregue' | 'cancelado';
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
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'outro';
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
    deliveryDate: string;
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
    stockDecremented?: boolean;
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
    settings: AppSettings;
}
