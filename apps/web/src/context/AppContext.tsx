import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Ingredient,
  Material,
  Product,
  Order,
  OrderStatus,
  AppSettings,
  PaymentRecord,
  PriceHistoryRecord,
  Customer,
  Commitment,
} from '../types';
import { api } from '../services/api';
import { calculateProductCost } from '../services/costEngine';

interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  ingredients: Ingredient[];
  materials: Material[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  commitments: Commitment[];
  settings: AppSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  editingIngredient: Ingredient | null;
  setEditingIngredient: (ing: Ingredient | null) => void;
  editingMaterial: Material | null;
  setEditingMaterial: (mat: Material | null) => void;
  editingProduct: Product | null;
  setEditingProduct: (prod: Product | null) => void;
  editingOrder: Order | null;
  setEditingOrder: (ord: Order | null) => void;
  editingCustomer: Customer | null;
  setEditingCustomer: (customer: Customer | null) => void;

  // Sync state
  isSyncing: boolean;
  serverOnline: boolean;

  // Toast notifications
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;

  // Ingredient Actions
  saveIngredientAction: (ing: Partial<Ingredient>) => Promise<Ingredient | null>;
  deleteIngredientAction: (id: string) => Promise<void>;
  addPriceHistoryAction: (
    ingredientId: string,
    history: Omit<PriceHistoryRecord, 'id'>,
  ) => Promise<void>;

  // Material Actions
  saveMaterialAction: (mat: Partial<Material>) => Promise<Material | null>;
  deleteMaterialAction: (id: string) => Promise<void>;
  adjustMaterialStockAction: (id: string, newStock: number, reason?: string) => Promise<void>;

  // Product Actions
  saveProductAction: (prod: Partial<Product>) => Promise<void>;
  deleteProductAction: (id: string) => Promise<void>;

  // Order Actions
  saveOrderAction: (ord: Partial<Order>) => Promise<string>;
  updateOrderStatusAction: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  deleteOrderAction: (id: string) => Promise<void>;
  addPaymentAction: (orderId: string, payment: Omit<PaymentRecord, 'id'>) => Promise<void>;
  removePaymentAction: (orderId: string, paymentId: string) => Promise<void>;

  // Customer Actions
  saveCustomerAction: (customer: Partial<Customer>) => Promise<Customer | null>;
  archiveCustomerAction: (id: string, archived?: boolean) => Promise<void>;
  deleteCustomerAction: (id: string) => Promise<boolean>;
  saveCommitmentAction: (commitment: Partial<Commitment>) => Promise<void>;
  deleteCommitmentAction: (id: string) => Promise<void>;

  // Settings & Reset
  updateSettingsAction: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllDataAction: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    storeName: 'Confeiti',
    storePhone: '',
    pixKey: '',
    pixKeyType: 'E-mail',
    defaultProfitMargin: 100,
    currencySymbol: 'R$',
  });

  const [activeTab, setActiveTab] = useState<string>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const lastRefreshAt = useRef(0);

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success',
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Synchronize state with backend
  const refreshData = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current;

    const refresh = (async () => {
      try {
        setIsSyncing(true);
        const [ingRes, matRes, prodRes, ordRes, custRes, commitmentRes, settRes] =
          await Promise.all([
            api.getIngredients(),
            api.getMaterials(),
            api.getProducts(),
            api.getOrders(),
            api.getCustomers(true),
            api.getCommitments(),
            api.getSettings(),
          ]);

        setIngredients(ingRes);
        setMaterials(matRes);
        setProducts(prodRes);
        setOrders(ordRes);
        setCustomers(custRes);
        setCommitments(commitmentRes);
        setSettings(settRes);
        setServerOnline(true);
      } catch (e) {
        console.warn('Backend unavailable:', e);
        setServerOnline(false);
      } finally {
        lastRefreshAt.current = Date.now();
        setIsSyncing(false);
      }
    })();

    refreshInFlight.current = refresh;
    try {
      await refresh;
    } finally {
      refreshInFlight.current = null;
    }
  }, []);

  // Load on entry and whenever the user navigates to another section. No polling.
  useEffect(() => {
    void refreshData();
  }, [refreshData, activeTab]);

  // Recalculate product costs whenever ingredients or materials change
  useEffect(() => {
    setProducts((prev) =>
      prev.map((p) => {
        const calculatedCost = calculateProductCost(p, ingredients, materials);
        return { ...p, calculatedCost };
      }),
    );
  }, [ingredients, materials]);

  // === Ingredient Handlers ===
  const saveIngredientAction = async (data: Partial<Ingredient>): Promise<Ingredient | null> => {
    try {
      const saved = await api.saveIngredient(data);
      setIngredients((prev) => {
        const exists = prev.some((i) => i.id === saved.id);
        if (exists) {
          return prev.map((i) => (i.id === saved.id ? saved : i));
        }
        return [saved, ...prev];
      });
      showToast('Ingrediente salvo com sucesso!');
      return saved;
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar no servidor.', 'error');
      return null;
    }
  };

  const deleteIngredientAction = async (id: string) => {
    try {
      await api.deleteIngredient(id);
      setIngredients((prev) => prev.filter((i) => i.id !== id));
      showToast('Ingrediente excluído.', 'info');
    } catch (e) {
      console.error(e);
      showToast('Erro ao excluir no servidor.', 'error');
    }
  };

  const addPriceHistoryAction = async (
    ingredientId: string,
    historyData: Omit<PriceHistoryRecord, 'id'>,
  ) => {
    try {
      const updated = await api.addPriceHistory(ingredientId, historyData);
      setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? updated : i)));
      showToast('Histórico de preço atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao registrar histórico.', 'error');
    }
  };

  // === Material Handlers ===
  const saveMaterialAction = async (data: Partial<Material>): Promise<Material | null> => {
    try {
      const saved = await api.saveMaterial(data);
      setMaterials((prev) => {
        const exists = prev.some((m) => m.id === saved.id);
        if (exists) {
          return prev.map((m) => (m.id === saved.id ? saved : m));
        }
        return [saved, ...prev];
      });
      showToast('Material salvo com sucesso!');
      return saved;
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar material.', 'error');
      return null;
    }
  };

  const deleteMaterialAction = async (id: string) => {
    try {
      await api.deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      showToast('Material excluído.', 'info');
    } catch (e) {
      console.error(e);
      showToast('Erro ao excluir material.', 'error');
    }
  };

  const adjustMaterialStockAction = async (id: string, newStock: number, reason?: string) => {
    try {
      const updated = await api.adjustMaterialStock(id, newStock, reason);
      setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
      showToast('Estoque atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar estoque.', 'error');
    }
  };

  // === Product Handlers ===
  const saveProductAction = async (data: Partial<Product>) => {
    try {
      const saved = await api.saveProduct(data);
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        if (exists) {
          return prev.map((p) => (p.id === saved.id ? saved : p));
        }
        return [saved, ...prev];
      });
      showToast('Produto salvo com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar produto.', 'error');
    }
  };

  const deleteProductAction = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Produto excluído.', 'info');
    } catch (e) {
      console.error(e);
      showToast('Erro ao excluir produto.', 'error');
    }
  };

  // === Order Handlers ===
  const saveOrderAction = async (data: Partial<Order>): Promise<string> => {
    try {
      const saved = await api.saveOrder(data);
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === saved.id);
        if (exists) {
          return prev.map((o) => (o.id === saved.id ? saved : o));
        }
        return [saved, ...prev];
      });
      // Also refresh materials because stock might have decremented
      api.getMaterials().then(setMaterials);
      showToast('Encomenda salva com sucesso!');
      return saved.id;
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar encomenda.', 'error');
      return data.id || 'ord-temp';
    }
  };

  const updateOrderStatusAction = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      api.getMaterials().then(setMaterials);
      showToast(`Status alterado para "${newStatus.toUpperCase()}"!`);
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar status.', 'error');
    }
  };

  const deleteOrderAction = async (id: string) => {
    try {
      await api.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selectedOrderId === id) {
        setSelectedOrderId(null);
      }
      showToast('Encomenda excluída.', 'info');
    } catch (e) {
      console.error(e);
      showToast('Erro ao excluir encomenda.', 'error');
    }
  };

  const addPaymentAction = async (orderId: string, paymentData: Omit<PaymentRecord, 'id'>) => {
    try {
      const updated = await api.addPayment(orderId, paymentData);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast('Pagamento registrado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao registrar pagamento.', 'error');
    }
  };

  const removePaymentAction = async (orderId: string, paymentId: string) => {
    try {
      const updated = await api.removePayment(orderId, paymentId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast('Pagamento removido com sucesso.', 'info');
    } catch (e) {
      console.error(e);
      showToast('Erro ao remover pagamento.', 'error');
    }
  };

  const saveCustomerAction = async (data: Partial<Customer>): Promise<Customer | null> => {
    try {
      const saved = await api.saveCustomer(data);
      setCustomers((prev) =>
        prev.some((c) => c.id === saved.id)
          ? prev.map((c) => (c.id === saved.id ? saved : c))
          : [saved, ...prev],
      );
      api
        .getOrders()
        .then(setOrders)
        .catch(() => undefined);
      showToast('Cliente salvo com sucesso!');
      return saved;
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar cliente.', 'error');
      return null;
    }
  };

  const archiveCustomerAction = async (id: string, archived = true) => {
    try {
      const updated = await api.archiveCustomer(id, archived);
      setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
      api
        .getOrders()
        .then(setOrders)
        .catch(() => undefined);
      showToast(archived ? 'Cliente arquivado.' : 'Cliente restaurado.');
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar cliente.', 'error');
    }
  };

  const deleteCustomerAction = async (id: string): Promise<boolean> => {
    try {
      await api.deleteCustomer(id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
      setOrders((prev) =>
        prev.map((order) =>
          order.customerId === id
            ? {
                ...order,
                customerId: undefined,
                clientName: 'Cliente não cadastrado',
                clientPhone: undefined,
                clientAddress: undefined,
              }
            : order,
        ),
      );
      showToast('Cliente excluído com sucesso.');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Erro ao excluir cliente.', 'error');
      return false;
    }
  };

  const saveCommitmentAction = async (data: Partial<Commitment>) => {
    try {
      const saved = await api.saveCommitment(data);
      setCommitments((prev) =>
        prev.some((c) => c.id === saved.id)
          ? prev.map((c) => (c.id === saved.id ? saved : c))
          : [...prev, saved],
      );
      showToast('Compromisso salvo com sucesso!');
    } catch {
      showToast('Erro ao salvar compromisso.', 'error');
    }
  };
  const deleteCommitmentAction = async (id: string) => {
    try {
      await api.deleteCommitment(id);
      setCommitments((prev) => prev.filter((c) => c.id !== id));
      showToast('Compromisso removido com sucesso.', 'info');
    } catch {
      showToast('Erro ao remover compromisso.', 'error');
    }
  };

  // === Settings & Reset ===
  const updateSettingsAction = async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = await api.saveSettings(newSettings);
      setSettings(updated);
      showToast('Configurações salvas com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar configurações.', 'error');
    }
  };

  const resetAllDataAction = async () => {
    try {
      await api.resetToDefault();
      await refreshData();
      setSelectedOrderId(null);
      showToast('Dados restaurados para demonstração!', 'info');
    } catch (e) {
      console.error(e);
      showToast('Não foi possível restaurar os dados.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        ingredients,
        materials,
        products,
        orders,
        customers,
        commitments,
        settings,
        activeTab,
        setActiveTab,
        selectedOrderId,
        setSelectedOrderId,
        editingIngredient,
        setEditingIngredient,
        editingMaterial,
        setEditingMaterial,
        editingProduct,
        setEditingProduct,
        editingOrder,
        setEditingOrder,
        editingCustomer,
        setEditingCustomer,
        isSyncing,
        serverOnline,
        toasts,
        showToast,
        saveIngredientAction,
        deleteIngredientAction,
        addPriceHistoryAction,
        saveMaterialAction,
        deleteMaterialAction,
        adjustMaterialStockAction,
        saveProductAction,
        deleteProductAction,
        saveOrderAction,
        updateOrderStatusAction,
        deleteOrderAction,
        addPaymentAction,
        removePaymentAction,
        saveCustomerAction,
        archiveCustomerAction,
        deleteCustomerAction,
        saveCommitmentAction,
        deleteCommitmentAction,
        updateSettingsAction,
        resetAllDataAction,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
