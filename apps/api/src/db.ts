import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Ingredient,
  Material,
  Product,
  Order,
  AppSettings,
  OrderStatus,
  PaymentRecord,
  PriceHistoryRecord,
  initialIngredients,
  initialMaterials,
  initialProducts,
  initialOrders,
  initialSettings,
} from '@jeh-doces/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  version: string;
  updatedAt: string;
  ingredients: Ingredient[];
  materials: Material[];
  products: Product[];
  orders: Order[];
  settings: AppSettings;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      } catch (e) {
        console.error('Error loading database file, initializing with seed data:', e);
      }
    }

    const defaultData: DatabaseSchema = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      ingredients: initialIngredients,
      materials: initialMaterials,
      products: initialProducts,
      orders: initialOrders,
      settings: initialSettings,
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave = this.data) {
    this.ensureDataDirectory();
    dataToSave.updatedAt = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // === Ingredients ===
  getIngredients(): Ingredient[] {
    return this.data.ingredients;
  }

  getIngredientById(id: string): Ingredient | undefined {
    return this.data.ingredients.find((i) => i.id === id);
  }

  saveIngredient(ingredientData: Partial<Ingredient>): Ingredient {
    const now = new Date().toISOString();
    if (ingredientData.id) {
      const idx = this.data.ingredients.findIndex((i) => i.id === ingredientData.id);
      if (idx >= 0) {
        const updated = {
          ...this.data.ingredients[idx],
          ...ingredientData,
          updatedAt: now,
        } as Ingredient;
        this.data.ingredients[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const newId = `ing-${Date.now()}`;
    const newIng: Ingredient = {
      id: newId,
      name: ingredientData.name || 'Novo Ingrediente',
      isComposite: !!ingredientData.isComposite,
      unit: ingredientData.unit || 'g',
      packageQuantity: ingredientData.packageQuantity || 1000,
      paidPrice: ingredientData.paidPrice || 0,
      unitCost: ingredientData.unitCost || 0,
      subIngredients: ingredientData.subIngredients || [],
      yieldQuantity: ingredientData.yieldQuantity,
      priceHistory: ingredientData.priceHistory || [
        {
          id: `ph-${Date.now()}`,
          date: now,
          paidPrice: ingredientData.paidPrice || 0,
          packageQuantity: ingredientData.packageQuantity || 1000,
          unitCost: ingredientData.unitCost || 0,
          notes: 'Cadastro inicial',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.data.ingredients.unshift(newIng);
    this.saveData();
    return newIng;
  }

  deleteIngredient(id: string): boolean {
    const prevLen = this.data.ingredients.length;
    this.data.ingredients = this.data.ingredients.filter((i) => i.id !== id);
    if (this.data.ingredients.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  addPriceHistory(
    ingredientId: string,
    historyData: Omit<PriceHistoryRecord, 'id'>
  ): Ingredient | null {
    const ing = this.getIngredientById(ingredientId);
    if (!ing) return null;

    const newRecord: PriceHistoryRecord = {
      id: `ph-${Date.now()}`,
      ...historyData,
    };

    ing.paidPrice = historyData.paidPrice;
    ing.packageQuantity = historyData.packageQuantity;
    ing.unitCost = historyData.unitCost;
    ing.priceHistory = [newRecord, ...(ing.priceHistory || [])];
    ing.updatedAt = new Date().toISOString();

    this.saveData();
    return ing;
  }

  // === Materials ===
  getMaterials(): Material[] {
    return this.data.materials;
  }

  getMaterialById(id: string): Material | undefined {
    return this.data.materials.find((m) => m.id === id);
  }

  saveMaterial(materialData: Partial<Material>): Material {
    const now = new Date().toISOString();
    if (materialData.id) {
      const idx = this.data.materials.findIndex((m) => m.id === materialData.id);
      if (idx >= 0) {
        const updated = {
          ...this.data.materials[idx],
          ...materialData,
          updatedAt: now,
        } as Material;
        this.data.materials[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const newId = `mat-${Date.now()}`;
    const newMat: Material = {
      id: newId,
      name: materialData.name || 'Novo Material',
      unit: materialData.unit || 'un',
      baseQuantity: materialData.baseQuantity || 1,
      totalCost: materialData.totalCost || 0,
      unitCost: materialData.unitCost || 0,
      trackStock: materialData.trackStock ?? true,
      stockQuantity: materialData.stockQuantity || 0,
      minStockAlert: materialData.minStockAlert,
      createdAt: now,
      updatedAt: now,
    };
    this.data.materials.unshift(newMat);
    this.saveData();
    return newMat;
  }

  deleteMaterial(id: string): boolean {
    const prevLen = this.data.materials.length;
    this.data.materials = this.data.materials.filter((m) => m.id !== id);
    if (this.data.materials.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  adjustMaterialStock(id: string, newStock: number): Material | null {
    const mat = this.getMaterialById(id);
    if (!mat) return null;
    mat.stockQuantity = newStock;
    mat.updatedAt = new Date().toISOString();
    this.saveData();
    return mat;
  }

  // === Products ===
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  saveProduct(productData: Partial<Product>): Product {
    const now = new Date().toISOString();
    if (productData.id) {
      const idx = this.data.products.findIndex((p) => p.id === productData.id);
      if (idx >= 0) {
        const updated = {
          ...this.data.products[idx],
          ...productData,
          updatedAt: now,
        } as Product;
        this.data.products[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const newId = `prod-${Date.now()}`;
    const newProd: Product = {
      id: newId,
      name: productData.name || 'Novo Produto',
      category: productData.category || 'Geral',
      description: productData.description || '',
      icon: productData.icon || '🧁',
      salePrice: productData.salePrice || 0,
      calculatedCost: productData.calculatedCost || 0,
      profitMargin: productData.profitMargin || 100,
      ingredients: productData.ingredients || [],
      materials: productData.materials || [],
      createdAt: now,
      updatedAt: now,
    };
    this.data.products.unshift(newProd);
    this.saveData();
    return newProd;
  }

  deleteProduct(id: string): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // === Orders ===
  getOrders(): Order[] {
    return this.data.orders;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  private decrementInventoryForOrder(order: Order) {
    if (order.stockDecremented) return;

    if (order.materials) {
      for (const orderMat of order.materials) {
        const mat = this.getMaterialById(orderMat.materialId);
        if (mat && mat.trackStock) {
          mat.stockQuantity = Math.max(0, mat.stockQuantity - orderMat.quantity);
        }
      }
    }

    if (order.items) {
      for (const orderItem of order.items) {
        const prod = this.getProductById(orderItem.productId);
        if (prod && prod.materials) {
          for (const pMat of prod.materials) {
            const mat = this.getMaterialById(pMat.materialId);
            if (mat && mat.trackStock) {
              mat.stockQuantity = Math.max(0, mat.stockQuantity - pMat.quantity * orderItem.quantity);
            }
          }
        }
      }
    }
    order.stockDecremented = true;
  }

  saveOrder(orderData: Partial<Order>): Order {
    const now = new Date().toISOString();
    if (orderData.id) {
      const idx = this.data.orders.findIndex((o) => o.id === orderData.id);
      if (idx >= 0) {
        const updated = {
          ...this.data.orders[idx],
          ...orderData,
          updatedAt: now,
        } as Order;
        this.data.orders[idx] = updated;
        this.saveData();
        return updated;
      }
    }

    const orderId = `ord-${Date.now()}`;
    const orderCount = this.data.orders.length + 1001;
    const newOrder: Order = {
      id: orderId,
      orderNumber: `#${orderCount}`,
      clientName: orderData.clientName || 'Novo Cliente',
      clientPhone: orderData.clientPhone || '',
      clientAddress: orderData.clientAddress || '',
      deliveryDate: orderData.deliveryDate || new Date().toISOString(),
      status: orderData.status || 'orcamento',
      items: orderData.items || [],
      materials: orderData.materials || [],
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      totalCharged: orderData.totalCharged || 0,
      estimatedCost: orderData.estimatedCost || 0,
      estimatedProfit: orderData.estimatedProfit || 0,
      profitMarginPercent: orderData.profitMarginPercent || 0,
      payments: orderData.payments || [],
      notes: orderData.notes || '',
      stockDecremented: false,
      createdAt: now,
      updatedAt: now,
    };

    if (['confirmado', 'produzindo', 'pronto', 'entregue'].includes(newOrder.status)) {
      this.decrementInventoryForOrder(newOrder);
    }

    this.data.orders.unshift(newOrder);
    this.saveData();
    return newOrder;
  }

  updateOrderStatus(id: string, newStatus: OrderStatus): Order | null {
    const ord = this.getOrderById(id);
    if (!ord) return null;

    ord.status = newStatus;
    ord.updatedAt = new Date().toISOString();

    if (
      ['confirmado', 'produzindo', 'pronto', 'entregue'].includes(newStatus) &&
      !ord.stockDecremented
    ) {
      this.decrementInventoryForOrder(ord);
    }

    this.saveData();
    return ord;
  }

  deleteOrder(id: string): boolean {
    const prevLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter((o) => o.id !== id);
    if (this.data.orders.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  addPayment(orderId: string, paymentData: Omit<PaymentRecord, 'id'>): Order | null {
    const ord = this.getOrderById(orderId);
    if (!ord) return null;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      ...paymentData,
    };

    ord.payments = [...(ord.payments || []), newPayment];
    ord.updatedAt = new Date().toISOString();
    this.saveData();
    return ord;
  }

  removePayment(orderId: string, paymentId: string): Order | null {
    const ord = this.getOrderById(orderId);
    if (!ord) return null;

    ord.payments = (ord.payments || []).filter((p: PaymentRecord) => p.id !== paymentId);
    ord.updatedAt = new Date().toISOString();
    this.saveData();
    return ord;
  }

  // === Settings ===
  getSettings(): AppSettings {
    return this.data.settings;
  }

  saveSettings(settingsData: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...this.data.settings,
      ...settingsData,
    };
    this.saveData();
    return this.data.settings;
  }

  // === Backup / Restore ===
  getAllData(): DatabaseSchema {
    return this.data;
  }

  restoreAllData(data: DatabaseSchema): boolean {
    this.data = data;
    this.saveData();
    return true;
  }

  resetToDefault() {
    this.data = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      ingredients: initialIngredients,
      materials: initialMaterials,
      products: initialProducts,
      orders: initialOrders,
      settings: initialSettings,
    };
    this.saveData();
  }
}

export const db = new Database();
