import { Ingredient, Material, Product, OrderStatus } from './types';
export declare const formatCurrency: (value: number | undefined | null) => string;
export declare const formatDecimal: (value: number | undefined | null, decimals?: number) => string;
export declare const parseLocaleNumber: (str: string) => number;
export declare const formatDateTime: (dateStr: string | undefined) => string;
export declare const formatDateOnly: (dateStr: string | undefined) => string;
export declare const calculateIngredientUnitCost: (paidPrice: number, packageQuantity: number, isComposite: boolean, subIngredients?: {
    ingredientId: string;
    quantity: number;
}[], allIngredients?: Ingredient[], yieldQuantity?: number) => number;
export declare const calculateMaterialUnitCost: (totalCost: number, baseQuantity: number) => number;
export declare const calculateProductCost: (product: Product, ingredients: Ingredient[], materials: Material[]) => number;
export interface OrderStatusConfig {
    label: string;
    stepNumber: number;
    badgeBg: string;
    badgeText: string;
    accentColor: string;
}
export declare const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig>;
export declare const ORDER_STATUS_STEPS: OrderStatus[];
