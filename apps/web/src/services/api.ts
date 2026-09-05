import {
  Ingredient,
  Material,
  Product,
  Order,
  AppSettings,
  OrderStatus,
  PaymentRecord,
  PriceHistoryRecord,
  StockMovement,
  DatabaseSchema,
  Customer,
  Commitment,
} from '../types';

const getApiBase = (): string => {
  // If running in development and not proxying or configured via env
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In dev with Vite proxy or in production behind the Nest API
  return '/api';
};

const API_BASE = getApiBase();
const inFlightRequests = new Map<string, Promise<unknown>>();

export interface CatalogCategorySummary {
  name: string;
  itemCount: number;
}

export interface BillingStatus {
  plan: 'basic' | 'monthly' | 'annual';
  status: 'active' | 'pending' | 'past_due' | 'canceled';
  currentPeriodEnd: string | null;
  pendingPaymentId?: string | null;
  payments?: { mercadoPagoId: string; plan: 'monthly' | 'annual'; amount: number; status: string; paidAt: string | null; createdAt: string }[];
}

export interface PixPayment {
  id: string;
  plan: 'monthly' | 'annual';
  amount: number;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

export interface RecurringSubscription { id: string; plan: 'monthly' | 'annual'; amount: number; checkoutUrl: string; }

export interface AccountDeletionStatus {
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
  deactivatedAt: string | null;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const key = `${method}:${endpoint}:${options?.body || ''}`;
  const existing = inFlightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const pending = requestOnce<T>(endpoint, options);
  inFlightRequests.set(key, pending);
  void pending
    .then(
      () => undefined,
      () => undefined,
    )
    .then(() => {
      if (inFlightRequests.get(key) === pending) inFlightRequests.delete(key);
    });
  return pending;
}

async function requestOnce<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error ${response.status}: ${errText}`);
  }

  return response.json();
}

export const api = {
  async getBilling(): Promise<BillingStatus> {
    return request<BillingStatus>('/billing');
  },
  async syncBilling(): Promise<BillingStatus> {
    return request<BillingStatus>('/billing/sync', { method: 'POST' });
  },
  async cancelPendingBilling(): Promise<BillingStatus> {
    return request<BillingStatus>('/billing/pending-payment', { method: 'DELETE' });
  },
  async createPixPayment(plan: 'monthly' | 'annual'): Promise<PixPayment> {
    return request<PixPayment>('/billing/pix', { method: 'POST', body: JSON.stringify({ plan }) });
  },
  async createRecurringSubscription(plan: 'monthly' | 'annual'): Promise<RecurringSubscription> {
    return request<RecurringSubscription>('/billing/recurring', { method: 'POST', body: JSON.stringify({ plan }) });
  },
  async cancelBilling(): Promise<BillingStatus> {
    return request<BillingStatus>('/billing/subscription', { method: 'DELETE' });
  },
  async getDeletionStatus(): Promise<AccountDeletionStatus> { return request<AccountDeletionStatus>('/account/deletion'); },
  async requestDeletion(): Promise<AccountDeletionStatus> { return request<AccountDeletionStatus>('/account/deletion', { method: 'POST', body: JSON.stringify({}) }); },
  async cancelDeletion(): Promise<AccountDeletionStatus> { return request<AccountDeletionStatus>('/account/deletion', { method: 'DELETE' }); },
  async getCommitments(): Promise<Commitment[]> {
    return request<Commitment[]>('/commitments');
  },
  async saveCommitment(data: Partial<Commitment>): Promise<Commitment> {
    return request<Commitment>(data.id ? `/commitments/${data.id}` : '/commitments', {
      method: data.id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
  },
  async deleteCommitment(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/commitments/${id}`, { method: 'DELETE' });
  },
  // === Customers ===
  async getCustomers(includeArchived = false, search = ''): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (includeArchived) params.set('archived', 'true');
    if (search.trim()) params.set('search', search.trim());
    const query = params.toString();
    return request<Customer[]>(`/customers${query ? `?${query}` : ''}`);
  },

  async saveCustomer(data: Partial<Customer>): Promise<Customer> {
    if (data.id) {
      return request<Customer>(`/customers/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    return request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) });
  },

  async archiveCustomer(id: string, archived = true): Promise<Customer> {
    return request<Customer>(`/customers/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
  },

  async deleteCustomer(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE' });
  },

  // === Ingredients ===
  async getIngredients(): Promise<Ingredient[]> {
    return request<Ingredient[]>('/ingredients');
  },

  async saveIngredient(data: Partial<Ingredient>): Promise<Ingredient> {
    if (data.id) {
      return request<Ingredient>(`/ingredients/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    return request<Ingredient>('/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteIngredient(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/ingredients/${id}`, {
      method: 'DELETE',
    });
  },

  async addPriceHistory(
    ingredientId: string,
    historyData: Omit<PriceHistoryRecord, 'id'>,
  ): Promise<Ingredient> {
    return request<Ingredient>(`/ingredients/${ingredientId}/history`, {
      method: 'POST',
      body: JSON.stringify(historyData),
    });
  },

  // === Materials ===
  async getMaterials(): Promise<Material[]> {
    return request<Material[]>('/materials');
  },
  async getCatalogCategories(type: 'product' | 'material'): Promise<CatalogCategorySummary[]> {
    return request<CatalogCategorySummary[]>(`/catalog-categories?type=${type}`);
  },
  async renameCatalogCategory(type: 'product' | 'material', name: string, newName: string) {
    return request<CatalogCategorySummary>(
      `/catalog-categories/${type}/${encodeURIComponent(name)}`,
      { method: 'PATCH', body: JSON.stringify({ name: newName }) },
    );
  },
  async deleteCatalogCategory(type: 'product' | 'material', name: string) {
    return request<{ success: boolean }>(
      `/catalog-categories/${type}/${encodeURIComponent(name)}`,
      { method: 'DELETE' },
    );
  },

  async saveMaterial(data: Partial<Material>): Promise<Material> {
    if (data.id) {
      return request<Material>(`/materials/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    return request<Material>('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteMaterial(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/materials/${id}`, {
      method: 'DELETE',
    });
  },

  async adjustMaterialStock(
    id: string,
    stockQuantity: number,
    reason = 'Ajuste manual',
  ): Promise<Material> {
    return request<Material>(`/materials/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stockQuantity, reason }),
    });
  },

  async getMaterialStockHistory(id: string): Promise<StockMovement[]> {
    return request<StockMovement[]>(`/materials/${id}/stock-history`);
  },

  // === Products ===
  async getProducts(): Promise<Product[]> {
    return request<Product[]>('/products');
  },

  async saveProduct(data: Partial<Product>): Promise<Product> {
    if (data.id) {
      return request<Product>(`/products/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // === Orders ===
  async getOrders(): Promise<Order[]> {
    return request<Order[]>('/orders');
  },

  async createOrderShareLink(id: string): Promise<{ token: string }> {
    return request<{ token: string }>(`/orders/${id}/share-link`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async saveOrder(data: Partial<Order>): Promise<Order> {
    if (data.id) {
      return request<Order>(`/orders/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteOrder(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addPayment(orderId: string, paymentData: Omit<PaymentRecord, 'id'>): Promise<Order> {
    return request<Order>(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  async removePayment(orderId: string, paymentId: string): Promise<Order> {
    return request<Order>(`/orders/${orderId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  },

  // === Settings ===
  async getSettings(): Promise<AppSettings> {
    return request<AppSettings>('/settings');
  },

  async saveSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    return request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // === Backup & Reset ===
  async getBackup(): Promise<DatabaseSchema> {
    return request<DatabaseSchema>('/backup');
  },

  async restoreBackup(data: DatabaseSchema): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/backup/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resetToDefault(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/backup/reset', {
      method: 'POST',
    });
  },
};
