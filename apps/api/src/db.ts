import { OrderStatus as PrismaOrderStatus, Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';
import {
  AppSettings, DatabaseSchema, Ingredient, Material, Order, OrderStatus,
  PaymentRecord, PriceHistoryRecord, Product, Customer, initialIngredients, initialMaterials,
  initialOrders, initialProducts, initialSettings,
} from '@jeh-doces/shared';

export const prisma = new PrismaClient();
const companyContext = new AsyncLocalStorage<string>();
export const runForCompany = <T>(companyId: string, callback: () => T) => companyContext.run(companyId, callback);
const activeStatuses: OrderStatus[] = ['confirmado', 'produzindo', 'pronto', 'entregue'];
const ingredientInclude = { priceHistory: { orderBy: { date: 'desc' as const } }, subIngredients: true };
const productInclude = { ingredients: true, materials: true };
const orderInclude = { items: true, materials: true, payments: { orderBy: { paidAt: 'asc' as const } }, customer: true };
type IngredientRow = Prisma.IngredientGetPayload<{ include: typeof ingredientInclude }>;
type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const iso = (value: Date) => value.toISOString();

function mapIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id, name: row.name, isComposite: row.isComposite,
    unit: row.unit as Ingredient['unit'], packageQuantity: row.packageQuantity,
    paidPrice: row.paidPrice, unitCost: row.unitCost,
    yieldQuantity: row.yieldQuantity ?? undefined,
    subIngredients: row.subIngredients.map(({ id, ingredientId, quantity }) => ({ id, ingredientId, quantity })),
    priceHistory: row.priceHistory.map(({ id, date, paidPrice, packageQuantity, unitCost, notes }) => ({
      id, date: iso(date), paidPrice, packageQuantity, unitCost, notes: notes ?? undefined,
    })),
    createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt),
  };
}

function mapMaterial(row: Prisma.MaterialGetPayload<object>): Material {
  return {
    id: row.id, name: row.name, unit: row.unit, baseQuantity: row.baseQuantity,
    totalCost: row.totalCost, unitCost: row.unitCost, trackStock: row.trackStock,
    stockQuantity: row.stockQuantity, minStockAlert: row.minStockAlert ?? undefined,
    createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt),
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id, name: row.name, category: row.category,
    description: row.description ?? undefined, icon: row.icon ?? undefined,
    salePrice: row.salePrice, calculatedCost: row.calculatedCost,
    profitMargin: row.profitMargin,
    ingredients: row.ingredients.map(({ ingredientId, quantity }) => ({ ingredientId, quantity })),
    materials: row.materials.map(({ materialId, quantity }) => ({ materialId, quantity })),
    createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt),
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id, orderNumber: row.orderNumber, clientName: row.customer?.name ?? 'Cliente não cadastrado',
    clientPhone: row.customer?.phone ?? undefined, clientAddress: row.customer?.address ?? undefined,
    customerId: row.customerId ?? undefined,
    deliveryDate: iso(row.deliveryDate), status: row.status as OrderStatus,
    items: row.items.map(({ orderId: _, ...item }) => item),
    materials: row.materials.map(({ orderId: _, ...item }) => item),
    subtotal: row.subtotal, discount: row.discount, totalCharged: row.totalCharged,
    estimatedCost: row.estimatedCost, estimatedProfit: row.estimatedProfit,
    profitMarginPercent: row.profitMarginPercent,
    payments: row.payments.map(({ orderId: _, createdAt: __, paidAt, notes, ...item }) => ({
      ...item, paidAt: iso(paidAt), notes: notes ?? undefined,
    })),
    notes: row.notes ?? undefined, stockDecremented: row.stockDecremented,
    createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt),
  };
}

const ingredientFields = (data: Partial<Ingredient>) => ({
  name: data.name ?? 'Novo Ingrediente', isComposite: data.isComposite ?? false,
  unit: data.unit ?? 'g', packageQuantity: data.packageQuantity ?? 1000,
  paidPrice: data.paidPrice ?? 0, unitCost: data.unitCost ?? 0,
  yieldQuantity: data.yieldQuantity ?? null,
});
const materialFields = (data: Partial<Material>) => ({
  name: data.name ?? 'Novo Material', unit: data.unit ?? 'un',
  baseQuantity: data.baseQuantity ?? 1, totalCost: data.totalCost ?? 0,
  unitCost: data.unitCost ?? 0, trackStock: data.trackStock ?? true,
  stockQuantity: data.stockQuantity ?? 0, minStockAlert: data.minStockAlert ?? null,
});
const productFields = (data: Partial<Product>) => ({
  name: data.name ?? 'Novo Produto', category: data.category ?? 'Geral',
  description: data.description ?? null, icon: data.icon ?? '🧁',
  salePrice: data.salePrice ?? 0, calculatedCost: data.calculatedCost ?? 0,
  profitMargin: data.profitMargin ?? 100,
});
const orderFields = (data: Partial<Order>, orderNumber: string) => ({
  orderNumber,
  deliveryDate: new Date(data.deliveryDate ?? Date.now()),
  status: (data.status ?? 'orcamento') as PrismaOrderStatus,
  subtotal: data.subtotal ?? 0, discount: data.discount ?? 0,
  totalCharged: data.totalCharged ?? 0, estimatedCost: data.estimatedCost ?? 0,
  estimatedProfit: data.estimatedProfit ?? 0,
  profitMarginPercent: data.profitMarginPercent ?? 0, notes: data.notes ?? null,
  stockDecremented: data.stockDecremented ?? false,
});

class Database {
  private companyId() {
    const companyId = companyContext.getStore();
    if (!companyId) throw new Error('Empresa não definida para esta operação.');
    return companyId;
  }
  connect = () => prisma.$connect();
  disconnect = () => prisma.$disconnect();
  async ping() { await prisma.$queryRaw`SELECT 1`; }

  async getIngredients() {
    return (await prisma.ingredient.findMany({ where: { companyId: this.companyId() }, include: ingredientInclude, orderBy: { createdAt: 'desc' } })).map(mapIngredient);
  }
  async getIngredientById(id: string) {
    const row = await prisma.ingredient.findFirst({ where: { id, companyId: this.companyId() }, include: ingredientInclude });
    return row ? mapIngredient(row) : null;
  }
  async saveIngredient(data: Partial<Ingredient>) {
    const relations = { subIngredients: { deleteMany: {}, create: (data.subIngredients ?? []).map(({ id, ingredientId, quantity }) => ({ ...(id ? { id } : {}), ingredientId, quantity })) } };
    let row: IngredientRow;
    const companyId = this.companyId();
    const subIngredientIds = [...new Set((data.subIngredients ?? []).map((item) => item.ingredientId))];
    if (subIngredientIds.length && await prisma.ingredient.count({ where: { id: { in: subIngredientIds }, companyId } }) !== subIngredientIds.length) throw new Error('Ingrediente relacionado inválido para esta empresa.');
    if (data.id && await prisma.ingredient.count({ where: { id: data.id, companyId } })) {
      row = await prisma.ingredient.update({ where: { id: data.id }, data: { ...ingredientFields(data), ...relations }, include: ingredientInclude });
    } else {
      const history = data.priceHistory?.length ? data.priceHistory : [{ date: new Date().toISOString(), paidPrice: data.paidPrice ?? 0, packageQuantity: data.packageQuantity ?? 1000, unitCost: data.unitCost ?? 0, notes: 'Cadastro inicial' }];
      row = await prisma.ingredient.create({
        data: { ...(data.id ? { id: data.id } : {}), companyId, ...ingredientFields(data),
          subIngredients: { create: relations.subIngredients.create },
          priceHistory: { create: history.map((item) => ({ ...('id' in item && item.id ? { id: item.id } : {}), date: new Date(item.date), paidPrice: item.paidPrice, packageQuantity: item.packageQuantity, unitCost: item.unitCost, notes: item.notes ?? null })) } },
        include: ingredientInclude,
      });
    }
    return mapIngredient(row);
  }
  async deleteIngredient(id: string) { return (await prisma.ingredient.deleteMany({ where: { id, companyId: this.companyId() } })).count > 0; }
  async addPriceHistory(id: string, data: Omit<PriceHistoryRecord, 'id'>) {
    if (!await prisma.ingredient.count({ where: { id, companyId: this.companyId() } })) return null;
    return mapIngredient(await prisma.ingredient.update({
      where: { id }, data: { paidPrice: data.paidPrice, packageQuantity: data.packageQuantity, unitCost: data.unitCost,
        priceHistory: { create: { date: new Date(data.date), paidPrice: data.paidPrice, packageQuantity: data.packageQuantity, unitCost: data.unitCost, notes: data.notes ?? null } } },
      include: ingredientInclude,
    }));
  }

  async getMaterials() { return (await prisma.material.findMany({ where: { companyId: this.companyId() }, orderBy: { createdAt: 'desc' } })).map(mapMaterial); }
  async getMaterialById(id: string) { const row = await prisma.material.findFirst({ where: { id, companyId: this.companyId() } }); return row ? mapMaterial(row) : null; }
  async saveMaterial(data: Partial<Material>) {
    const companyId = this.companyId();
    const row = data.id && await prisma.material.count({ where: { id: data.id, companyId } })
      ? await prisma.material.update({ where: { id: data.id }, data: materialFields(data) })
      : await prisma.material.create({ data: { ...(data.id ? { id: data.id } : {}), companyId, ...materialFields(data) } });
    return mapMaterial(row);
  }
  async deleteMaterial(id: string) { return (await prisma.material.deleteMany({ where: { id, companyId: this.companyId() } })).count > 0; }
  async adjustMaterialStock(id: string, stockQuantity: number) {
    if (!await prisma.material.count({ where: { id, companyId: this.companyId() } })) return null;
    return mapMaterial(await prisma.material.update({ where: { id }, data: { stockQuantity } }));
  }

  async getProducts() { return (await prisma.product.findMany({ where: { companyId: this.companyId() }, include: productInclude, orderBy: { createdAt: 'desc' } })).map(mapProduct); }
  async getProductById(id: string) { const row = await prisma.product.findFirst({ where: { id, companyId: this.companyId() }, include: productInclude }); return row ? mapProduct(row) : null; }
  async saveProduct(data: Partial<Product>) {
    const relations = {
      ingredients: { deleteMany: {}, create: (data.ingredients ?? []).map(({ ingredientId, quantity }) => ({ ingredientId, quantity })) },
      materials: { deleteMany: {}, create: (data.materials ?? []).map(({ materialId, quantity }) => ({ materialId, quantity })) },
    };
    const companyId = this.companyId();
    const ingredientIds = [...new Set((data.ingredients ?? []).map((item) => item.ingredientId))];
    const materialIds = [...new Set((data.materials ?? []).map((item) => item.materialId))];
    if (ingredientIds.length && await prisma.ingredient.count({ where: { id: { in: ingredientIds }, companyId } }) !== ingredientIds.length) throw new Error('Ingrediente relacionado inválido para esta empresa.');
    if (materialIds.length && await prisma.material.count({ where: { id: { in: materialIds }, companyId } }) !== materialIds.length) throw new Error('Material relacionado inválido para esta empresa.');
    const row = data.id && await prisma.product.count({ where: { id: data.id, companyId } })
      ? await prisma.product.update({ where: { id: data.id }, data: { ...productFields(data), ...relations }, include: productInclude })
      : await prisma.product.create({ data: { ...(data.id ? { id: data.id } : {}), companyId, ...productFields(data), ingredients: { create: relations.ingredients.create }, materials: { create: relations.materials.create } }, include: productInclude });
    return mapProduct(row);
  }
  async deleteProduct(id: string) { return (await prisma.product.deleteMany({ where: { id, companyId: this.companyId() } })).count > 0; }

  async getOrders() { return (await prisma.order.findMany({ where: { companyId: this.companyId() }, include: orderInclude, orderBy: { createdAt: 'desc' } })).map(mapOrder); }
  async createOrderShareLink(id: string) {
    const row = await prisma.order.findFirst({ where: { id, companyId: this.companyId() } });
    if (!row) return null;
    const updated = await prisma.order.update({ where: { id }, data: { shareToken: randomBytes(32).toString('hex') } });
    return updated.shareToken;
  }
  async getPublicOrder(token: string) {
    const row = await prisma.order.findUnique({ where: { shareToken: token }, include: orderInclude });
    return row ? mapOrder(row) : null;
  }
  async getCustomers(includeArchived = false): Promise<Customer[]> {
    const rows = await prisma.customer.findMany({ where: { companyId: this.companyId(), ...(includeArchived ? {} : { archivedAt: null }) }, orderBy: { name: 'asc' } });
    return rows.map(row => ({ id: row.id, name: row.name, phone: row.phone ?? undefined, email: row.email ?? undefined, address: row.address ?? undefined, notes: row.notes ?? undefined, archivedAt: row.archivedAt ? iso(row.archivedAt) : undefined, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }));
  }
  async saveCustomer(data: Partial<Customer>) {
    const companyId = this.companyId();
    const fields = { name: (data.name ?? '').trim(), phone: data.phone?.trim() || null, email: data.email?.trim().toLowerCase() || null, address: data.address?.trim() || null, notes: data.notes?.trim() || null };
    if (fields.name.length < 1) throw new Error('Informe o nome do cliente.');
    const exists = data.id ? await prisma.customer.count({ where: { id: data.id, companyId } }) : 0;
    const row = exists ? await prisma.customer.update({ where: { id: data.id }, data: fields }) : await prisma.customer.create({ data: { companyId, ...fields } });
    return { id: row.id, name: row.name, phone: row.phone ?? undefined, email: row.email ?? undefined, address: row.address ?? undefined, notes: row.notes ?? undefined, archivedAt: row.archivedAt ? iso(row.archivedAt) : undefined, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
  }
  async archiveCustomer(id: string, archived: boolean) {
    const row = await prisma.customer.findFirst({ where: { id, companyId: this.companyId() } });
    if (!row) return null;
    const updated = await prisma.customer.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
    return { id: updated.id, name: updated.name, phone: updated.phone ?? undefined, email: updated.email ?? undefined, address: updated.address ?? undefined, notes: updated.notes ?? undefined, archivedAt: updated.archivedAt ? iso(updated.archivedAt) : undefined, createdAt: iso(updated.createdAt), updatedAt: iso(updated.updatedAt) };
  }
  private async decrementInventory(tx: Prisma.TransactionClient, id: string) {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true, materials: true } });
    if (!order || order.stockDecremented) return;
    const deductions = new Map<string, number>();
    for (const item of order.materials) deductions.set(item.materialId, (deductions.get(item.materialId) ?? 0) + item.quantity);
    for (const item of order.items) {
      for (const material of await tx.productMaterial.findMany({ where: { productId: item.productId } })) {
        deductions.set(material.materialId, (deductions.get(material.materialId) ?? 0) + material.quantity * item.quantity);
      }
    }
    for (const [materialId, quantity] of deductions) {
      const material = await tx.material.findUnique({ where: { id: materialId } });
      if (material?.trackStock) await tx.material.update({ where: { id: materialId }, data: { stockQuantity: Math.max(0, material.stockQuantity - quantity) } });
    }
    await tx.order.update({ where: { id }, data: { stockDecremented: true } });
  }
  async saveOrder(data: Partial<Order>) {
    return prisma.$transaction(async (tx) => {
      const companyId = this.companyId();
      let customerId = data.customerId;
      if (customerId && !await tx.customer.count({ where: { id: customerId, companyId } })) throw new Error('Cliente relacionado inválido para esta empresa.');
      if (!customerId && data.clientName?.trim()) {
        const customer = await tx.customer.create({ data: { companyId, name: data.clientName.trim(), phone: data.clientPhone?.trim() || null, address: data.clientAddress?.trim() || null } });
        customerId = customer.id;
      }
      const productIds = [...new Set((data.items ?? []).map((item) => item.productId))];
      const materialIds = [...new Set((data.materials ?? []).map((item) => item.materialId))];
      if (productIds.length && await tx.product.count({ where: { id: { in: productIds }, companyId } }) !== productIds.length) throw new Error('Produto relacionado inválido para esta empresa.');
      if (materialIds.length && await tx.material.count({ where: { id: { in: materialIds }, companyId } }) !== materialIds.length) throw new Error('Material relacionado inválido para esta empresa.');
      const exists = data.id ? await tx.order.count({ where: { id: data.id, companyId } }) : 0;
      const orderNumber = exists ? (await tx.order.findUniqueOrThrow({ where: { id: data.id! }, select: { orderNumber: true } })).orderNumber : data.orderNumber || `#${await tx.order.count({ where: { companyId } }) + 1001}`;
      const relations = {
        items: { deleteMany: {}, create: (data.items ?? []).map((item) => ({ ...item })) },
        materials: { deleteMany: {}, create: (data.materials ?? []).map((item) => ({ ...item })) },
        payments: { deleteMany: {}, create: (data.payments ?? []).map((item) => ({ ...item, paidAt: new Date(item.paidAt) })) },
      };
      const row = exists
        ? await tx.order.update({ where: { id: data.id }, data: { ...orderFields(data, orderNumber), customerId: customerId ?? null, ...relations } })
        : await tx.order.create({ data: { ...(data.id ? { id: data.id } : {}), companyId, ...orderFields(data, orderNumber), customerId: customerId ?? null, items: { create: relations.items.create }, materials: { create: relations.materials.create }, payments: { create: relations.payments.create } } });
      if (activeStatuses.includes((data.status ?? 'orcamento') as OrderStatus)) await this.decrementInventory(tx, row.id);
      return mapOrder(await tx.order.findUniqueOrThrow({ where: { id: row.id }, include: orderInclude }));
    });
  }
  async deleteOrder(id: string) { return (await prisma.order.deleteMany({ where: { id, companyId: this.companyId() } })).count > 0; }
  async updateOrderStatus(id: string, status: OrderStatus) {
    return prisma.$transaction(async (tx) => {
      if (!await tx.order.count({ where: { id, companyId: this.companyId() } })) return null;
      await tx.order.update({ where: { id }, data: { status: status as PrismaOrderStatus } });
      if (activeStatuses.includes(status)) await this.decrementInventory(tx, id);
      return mapOrder(await tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude }));
    });
  }
  async addPayment(orderId: string, data: Omit<PaymentRecord, 'id'>) {
    if (!await prisma.order.count({ where: { id: orderId, companyId: this.companyId() } })) return null;
    await prisma.payment.create({ data: { orderId, amount: data.amount, method: data.method, paidAt: new Date(data.paidAt), notes: data.notes ?? null } });
    return mapOrder(await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude }));
  }
  async removePayment(orderId: string, paymentId: string) {
    if (!await prisma.order.count({ where: { id: orderId, companyId: this.companyId() } })) return null;
    await prisma.payment.deleteMany({ where: { id: paymentId, orderId } });
    return mapOrder(await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude }));
  }

  async getSettings(): Promise<AppSettings> {
    const companyId = this.companyId();
    const row = await prisma.setting.upsert({ where: { companyId }, create: { companyId, ...initialSettings }, update: {} });
    return { storeName: row.storeName, storePhone: row.storePhone ?? '', pixKey: row.pixKey ?? '', pixKeyType: row.pixKeyType ?? '', defaultProfitMargin: row.defaultProfitMargin, currencySymbol: row.currencySymbol };
  }
  async saveSettings(data: Partial<AppSettings>) {
    const companyId = this.companyId();
    const value = { ...await this.getSettings(), ...data };
    const row = await prisma.setting.upsert({ where: { companyId }, create: { companyId, ...value }, update: value });
    return { storeName: row.storeName, storePhone: row.storePhone ?? '', pixKey: row.pixKey ?? '', pixKeyType: row.pixKeyType ?? '', defaultProfitMargin: row.defaultProfitMargin, currencySymbol: row.currencySymbol };
  }
  async getAllData(): Promise<DatabaseSchema> {
    return { version: '2.0.0', updatedAt: new Date().toISOString(), ingredients: await this.getIngredients(), materials: await this.getMaterials(), products: await this.getProducts(), orders: await this.getOrders(), settings: await this.getSettings() };
  }
  private async clearAll() {
    const companyId = this.companyId();
    const orders = await prisma.order.findMany({ where: { companyId }, select: { id: true } });
    const products = await prisma.product.findMany({ where: { companyId }, select: { id: true } });
    const ingredients = await prisma.ingredient.findMany({ where: { companyId }, select: { id: true } });
    const orderIds = orders.map(({ id }) => id);
    const productIds = products.map(({ id }) => id);
    const ingredientIds = ingredients.map(({ id }) => id);
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } }),
      prisma.orderMaterial.deleteMany({ where: { orderId: { in: orderIds } } }),
      prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
      prisma.order.deleteMany({ where: { companyId } }),
      prisma.productMaterial.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.productIngredient.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.product.deleteMany({ where: { companyId } }),
      prisma.subIngredient.deleteMany({ where: { parentId: { in: ingredientIds } } }),
      prisma.priceHistory.deleteMany({ where: { ingredientId: { in: ingredientIds } } }),
      prisma.ingredient.deleteMany({ where: { companyId } }),
      prisma.material.deleteMany({ where: { companyId } }),
      prisma.setting.deleteMany({ where: { companyId } }),
    ]);
  }
  async restoreAllData(data: DatabaseSchema) {
    await this.clearAll();
    for (const item of data.ingredients) await this.saveIngredient(item);
    for (const item of data.materials) await this.saveMaterial(item);
    for (const item of data.products) await this.saveProduct(item);
    for (const item of data.orders) await this.saveOrder(item);
    await this.saveSettings(data.settings);
    return true;
  }
  async resetToDefault() {
    await this.restoreAllData({ version: '2.0.0', updatedAt: new Date().toISOString(), ingredients: initialIngredients, materials: initialMaterials, products: initialProducts, orders: initialOrders, settings: initialSettings });
  }
}

export const db = new Database();
