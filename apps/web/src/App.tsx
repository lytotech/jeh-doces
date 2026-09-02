import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { BottomNav } from './components/layout/BottomNav';
import { ToastContainer } from './components/ui/ToastContainer';
import { BackupSettingsModal } from './components/settings/BackupSettingsModal';

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

export const App: React.FC = () => {
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
    orders,
  } = useApp();

  const [isCreatingNewOrder, setIsCreatingNewOrder] = useState(false);
  const [isCreatingNewIngredient, setIsCreatingNewIngredient] = useState(false);
  const [isCreatingNewMaterial, setIsCreatingNewMaterial] = useState(false);
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

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
          return (
            <ProductForm
              product={null}
              onBack={() => setIsCreatingNewProduct(false)}
            />
          );
        }

        if (editingProduct) {
          return (
            <ProductForm
              product={editingProduct}
              onBack={() => setEditingProduct(null)}
            />
          );
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
            <IngredientForm
              ingredient={null}
              onBack={() => setIsCreatingNewIngredient(false)}
            />
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
          return (
            <MaterialForm
              material={null}
              onBack={() => setIsCreatingNewMaterial(false)}
            />
          );
        }

        if (editingMaterial) {
          return (
            <MaterialForm
              material={editingMaterial}
              onBack={() => setEditingMaterial(null)}
            />
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

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
      <main className="flex-1 w-full max-w-lg mx-auto bg-[#FAF7F2] shadow-sm min-h-screen relative">
        {renderContent()}
      </main>

      <BottomNav />
      <ToastContainer />

      {showSettingsModal && (
        <BackupSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
export default App;
