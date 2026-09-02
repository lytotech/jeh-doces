import { Ingredient, Material, Product, Order, AppSettings } from '../types';
import {
  initialIngredients,
  initialMaterials,
  initialProducts,
  initialOrders,
  initialSettings,
} from './seedData';

const KEYS = {
  INGREDIENTS: 'jeh_doces_ingredients_v1',
  MATERIALS: 'jeh_doces_materials_v1',
  PRODUCTS: 'jeh_doces_products_v1',
  ORDERS: 'jeh_doces_orders_v1',
  SETTINGS: 'jeh_doces_settings_v1',
};

export const loadIngredients = (): Ingredient[] => {
  try {
    const data = localStorage.getItem(KEYS.INGREDIENTS);
    return data ? JSON.parse(data) : initialIngredients;
  } catch (e) {
    console.error('Error loading ingredients', e);
    return initialIngredients;
  }
};

export const saveIngredients = (ingredients: Ingredient[]): void => {
  try {
    localStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(ingredients));
  } catch (e) {
    console.error('Error saving ingredients', e);
  }
};

export const loadMaterials = (): Material[] => {
  try {
    const data = localStorage.getItem(KEYS.MATERIALS);
    return data ? JSON.parse(data) : initialMaterials;
  } catch (e) {
    console.error('Error loading materials', e);
    return initialMaterials;
  }
};

export const saveMaterials = (materials: Material[]): void => {
  try {
    localStorage.setItem(KEYS.MATERIALS, JSON.stringify(materials));
  } catch (e) {
    console.error('Error saving materials', e);
  }
};

export const loadProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : initialProducts;
  } catch (e) {
    console.error('Error loading products', e);
    return initialProducts;
  }
};

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products', e);
  }
};

export const loadOrders = (): Order[] => {
  try {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : initialOrders;
  } catch (e) {
    console.error('Error loading orders', e);
    return initialOrders;
  }
};

export const saveOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders', e);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : initialSettings;
  } catch (e) {
    console.error('Error loading settings', e);
    return initialSettings;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

export interface BackupData {
  version: string;
  exportedAt: string;
  ingredients: Ingredient[];
  materials: Material[];
  products: Product[];
  orders: Order[];
  settings: AppSettings;
}

export const exportAllDataJSON = (): string => {
  const data: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    ingredients: loadIngredients(),
    materials: loadMaterials(),
    products: loadProducts(),
    orders: loadOrders(),
    settings: loadSettings(),
  };
  return JSON.stringify(data, null, 2);
};

export const importAllDataJSON = (jsonStr: string): boolean => {
  try {
    const data = JSON.parse(jsonStr) as BackupData;
    if (data.ingredients && Array.isArray(data.ingredients)) {
      saveIngredients(data.ingredients);
    }
    if (data.materials && Array.isArray(data.materials)) {
      saveMaterials(data.materials);
    }
    if (data.products && Array.isArray(data.products)) {
      saveProducts(data.products);
    }
    if (data.orders && Array.isArray(data.orders)) {
      saveOrders(data.orders);
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    return true;
  } catch (e) {
    console.error('Failed to import backup data', e);
    return false;
  }
};

export const resetToSampleData = (): void => {
  saveIngredients(initialIngredients);
  saveMaterials(initialMaterials);
  saveProducts(initialProducts);
  saveOrders(initialOrders);
  saveSettings(initialSettings);
};
