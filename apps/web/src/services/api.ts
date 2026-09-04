import {
  Ingredient,
  Material,
  Product,
  Order,
  AppSettings,
  OrderStatus,
  PaymentRecord,
  PriceHistoryRecord,
  DatabaseSchema,
  Customer,
  Commitment,
} from '../types';

const getApiBase = (): string => {
  // If running in development and not proxying or configured via env
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In dev with Vite proxy or production with Express
  return '/api';
};

const API_BASE = getApiBase();

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error ${response.status}: ${errText}`);
  }

  return response.json();
}

export const api = {
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

  async adjustMaterialStock(id: string, stockQuantity: number): Promise<Material> {
    return request<Material>(`/materials/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stockQuantity }),
    });
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
    return request<{ token: string }>(`/orders/${id}/share-link`, { method: 'POST' });
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
