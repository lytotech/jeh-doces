import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Cookie,
  Package,
  Cake,
  BarChart3,
  Users,
  LogOut,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setSelectedOrderId } = useApp();
  const { logout } = useAuth();

  const navItems = [
    {
      id: 'orders',
      label: 'Encomendas',
      icon: ClipboardList,
    },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'calendar', label: 'Agenda', icon: CalendarDays },
    {
      id: 'products',
      label: 'Produtos',
      icon: Cake,
    },
    {
      id: 'ingredients',
      label: 'Ingredientes',
      icon: Cookie,
    },
    {
      id: 'materials',
      label: 'Materiais',
      icon: Package,
    },
    {
      id: 'dashboard',
      label: 'Relatórios',
      icon: BarChart3,
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'orders') {
      setSelectedOrderId(null);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DECFC] shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-3xl mx-auto flex items-center justify-around py-1.5 px-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[64px] ${
                isActive
                  ? 'text-[#96642F] font-semibold scale-105'
                  : 'text-[#8C7665] hover:text-[#5C4533]'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#F5ECE0]' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => void logout()}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 min-w-[58px] text-rose-700 hover:text-rose-800"
          aria-label="Sair"
        >
          <div className="p-1 rounded-xl">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Sair</span>
        </button>
      </div>
    </nav>
  );
};
