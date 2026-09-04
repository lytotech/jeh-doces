import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Cookie,
  Package,
  Cake,
  BarChart3,
  Users,
  CalendarDays,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  onOpenSettings: () => void;
  onOpenTeam: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenSettings, onOpenTeam }) => {
  const { activeTab, setActiveTab, setSelectedOrderId } = useApp();
  const { logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

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
    <nav className="relative md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DECFC] shadow-lg pb-[env(safe-area-inset-bottom)]">
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
          type="button"
          onClick={() => setSettingsOpen((open) => !open)}
          className={`flex min-w-[64px] flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all duration-200 ${
            settingsOpen ? 'font-semibold text-[#96642F]' : 'text-[#8C7665] hover:text-[#5C4533]'
          }`}
          aria-label="Configurações"
          aria-expanded={settingsOpen}
          aria-haspopup="menu"
        >
          <div
            className={`rounded-xl p-1 transition-colors ${
              settingsOpen ? 'bg-[#F5ECE0]' : 'bg-transparent'
            }`}
          >
            <SettingsIcon className={`h-5 w-5 ${settingsOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="mt-0.5 text-[11px] tracking-tight">Config.</span>
        </button>
      </div>

      {settingsOpen && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+0.5rem)] right-2 min-w-56 rounded-2xl border border-[#E5DACD] bg-white p-2 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setSettingsOpen(false);
              onOpenSettings();
            }}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#5C4533] hover:bg-[#F5ECE0]"
          >
            Configurações & Backup
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setSettingsOpen(false);
              onOpenTeam();
            }}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#5C4533] hover:bg-[#F5ECE0]"
          >
            Equipe
          </button>
          <div className="my-1 border-t border-[#F0E8DF]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </nav>
  );
};
