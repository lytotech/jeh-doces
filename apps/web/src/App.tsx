import React, { useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { InactiveCompanyView } from './components/account/InactiveCompanyView';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { ToastContainer } from './components/ui/ToastContainer';
import { BackupSettingsModal } from './components/settings/BackupSettingsModal';
import { TeamModal } from './components/settings/TeamModal';
import { BillingBanner } from './components/billing/BillingBanner';
import { BillingPage } from './components/billing/BillingPage';

// Orders
import { OrderList } from './components/orders/OrderList';
import { OrderDetailView } from './components/orders/OrderDetailView';
import { OrderForm } from './components/orders/OrderForm';

// Ingredients
import { IngredientList } from './components/ingredients/IngredientList';
import { IngredientForm } from './components/ingredients/IngredientForm';

// Materials
import { MaterialList } from './components/materials/MaterialList';
import { MaterialForm } from './components/materials/MaterialForm';

// Products
import { ProductList } from './components/products/ProductList';
import { ProductForm } from './components/products/ProductForm';

// Dashboard
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerForm } from './components/customers/CustomerForm';
import { CalendarView } from './components/calendar/CalendarView';

export const App: React.FC = () => {
  const { auth } = useAuth();
  const {
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
    orders,
  } = useApp();

  const [isCreatingNewOrder, setIsCreatingNewOrder] = useState(false);
  const [isCreatingNewIngredient, setIsCreatingNewIngredient] = useState(false);
  const [isCreatingNewMaterial, setIsCreatingNewMaterial] = useState(false);
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  if (auth?.companyInactive) return <InactiveCompanyView />;

  // Cada tela começa no topo; evita herdar a posição de rolagem da tela anterior.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [
    activeTab,
    selectedOrderId,
    editingIngredient,
    editingMaterial,
    editingProduct,
    editingOrder,
    editingCustomer,
  ]);

  // Render content according to active tab and active detail/form views
  const renderContent = () => {
    switch (activeTab) {
      case 'orders': {
        if (isCreatingNewOrder) {
          return (
            <OrderForm
              order={null}
              onBack={() => setIsCreatingNewOrder(false)}
              onSaved={(savedId) => {
                setIsCreatingNewOrder(false);
                setSelectedOrderId(savedId);
              }}
            />
          );
        }

        if (editingOrder) {
          return (
            <OrderForm
              order={editingOrder}
              onBack={() => setEditingOrder(null)}
              onSaved={(savedId) => {
                setEditingOrder(null);
                setSelectedOrderId(savedId);
              }}
            />
          );
        }

        if (selectedOrder) {
          return (
            <OrderDetailView
              order={selectedOrder}
              onBack={() => setSelectedOrderId(null)}
              onEdit={() => setEditingOrder(selectedOrder)}
            />
          );
        }

        return (
          <OrderList
            onSelectOrder={(ord) => setSelectedOrderId(ord.id)}
            onNewOrder={() => setIsCreatingNewOrder(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        );
      }

      case 'products': {
        if (isCreatingNewProduct) {
          return <ProductForm product={null} onBack={() => setIsCreatingNewProduct(false)} />;
        }

        if (editingProduct) {
          return <ProductForm product={editingProduct} onBack={() => setEditingProduct(null)} />;
        }

        return (
          <ProductList
            onSelectProduct={(prod) => setEditingProduct(prod)}
            onNewProduct={() => setIsCreatingNewProduct(true)}
          />
        );
      }

      case 'ingredients': {
        if (isCreatingNewIngredient) {
          return (
            <IngredientForm ingredient={null} onBack={() => setIsCreatingNewIngredient(false)} />
          );
        }

        if (editingIngredient) {
          return (
            <IngredientForm
              ingredient={editingIngredient}
              onBack={() => setEditingIngredient(null)}
            />
          );
        }

        return (
          <IngredientList
            onSelectIngredient={(ing) => setEditingIngredient(ing)}
            onNewIngredient={() => setIsCreatingNewIngredient(true)}
          />
        );
      }

      case 'materials': {
        if (isCreatingNewMaterial) {
          return <MaterialForm material={null} onBack={() => setIsCreatingNewMaterial(false)} />;
        }

        if (editingMaterial) {
          return (
            <MaterialForm material={editingMaterial} onBack={() => setEditingMaterial(null)} />
          );
        }

        return (
          <MaterialList
            onSelectMaterial={(mat) => setEditingMaterial(mat)}
            onNewMaterial={() => setIsCreatingNewMaterial(true)}
          />
        );
      }

      case 'dashboard': {
        return (
          <DashboardView
            onSelectOrder={(ord) => {
              setActiveTab('orders');
              setSelectedOrderId(ord.id);
            }}
            onNewOrder={() => {
              setActiveTab('orders');
              setIsCreatingNewOrder(true);
            }}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        );
      }

      case 'customers': {
        if (isCreatingNewCustomer)
          return <CustomerForm customer={null} onBack={() => setIsCreatingNewCustomer(false)} />;
        if (editingCustomer)
          return (
            <CustomerForm customer={editingCustomer} onBack={() => setEditingCustomer(null)} />
          );
        return (
          <CustomerList
            onSelectCustomer={setEditingCustomer}
            onNewCustomer={() => setIsCreatingNewCustomer(true)}
          />
        );
      }

      case 'calendar':
        return (
          <CalendarView
            onSelectOrder={(order) => {
              setActiveTab('orders');
              setSelectedOrderId(order.id);
            }}
          />
        );

      case 'billing':
        return <BillingPage onBack={() => setActiveTab('orders')} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-row">
      {/* Sidebar on desktop */}
      <Sidebar
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenTeam={() => setShowTeamModal(true)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F2] min-h-screen relative">
        <BillingBanner />
        <main className="flex-1 w-full pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Bottom Nav on mobile */}
      <BottomNav
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenTeam={() => setShowTeamModal(true)}
      />
      <ToastContainer />

      {showSettingsModal && (
        <BackupSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
      {showTeamModal && (
        <TeamModal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} />
      )}
    </div>
  );
};
export default App;
