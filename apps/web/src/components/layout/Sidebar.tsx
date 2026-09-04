import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Cookie,
  Package,
  Cake,
  BarChart3,
  Settings as SettingsIcon,
  Store,
  Wifi,
  WifiOff,
  Users,
  LogOut,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenTeam: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onOpenTeam }) => {
  const { activeTab, setActiveTab, setSelectedOrderId, serverOnline, isSyncing } = useApp();
  const { auth, logout, switchCompany } = useAuth();

  const navItems = [
    {
      id: 'orders',
      label: 'Encomendas',
      icon: ClipboardList,
      badge: 'Pedidos',
    },
    { id: 'customers', label: 'Clientes', icon: Users, badge: 'Cadastro' },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays, badge: 'Agenda' },
    {
      id: 'products',
      label: 'Cardápio & Receitas',
      icon: Cake,
      badge: 'CMV',
    },
    {
      id: 'ingredients',
      label: 'Ingredientes',
      icon: Cookie,
      badge: 'Insumos',
    },
    {
      id: 'materials',
      label: 'Materiais & Estoque',
      icon: Package,
      badge: 'Embalagens',
    },
    {
      id: 'dashboard',
      label: 'Relatórios & Painel',
      icon: BarChart3,
      badge: 'Métricas',
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'orders') {
      setSelectedOrderId(null);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FAF5EE] border-r border-[#E8DECFC] shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E8DECFC] bg-[#B57E44] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-xl shadow-xs shrink-0">
            <img src="/confeiti-mark.svg" alt="Confeiti" className="w-10 h-10 rounded-2xl shadow-xs shrink-0" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-serif font-bold tracking-wide text-white truncate drop-shadow-xs">
              Confeiti
            </h2>
            <p className="text-xs text-amber-100 font-sans truncate">
              Gestão para confeitaria
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-[#8C7665] uppercase tracking-wider">
          Menu Principal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-[#96642F] text-white shadow-sm'
                  : 'text-[#5C4533] hover:bg-[#F2ECE1] hover:text-[#362517]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white stroke-[2.5]' : 'text-[#8C7665]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#EFE8DE] text-[#7A6453] group-hover:bg-[#E5DACD]'
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Server Status & Settings */}
      <div className="p-4 border-t border-[#E8DECFC] bg-[#F5ECE0]/60 space-y-2">
        <div className="px-2 pb-1">
          <p className="text-xs font-bold text-[#5C4533] truncate">{auth?.user.name}</p>
          <p className="text-[10px] text-[#8C7665] truncate">{auth?.user.email}</p>
          {auth && auth.companies.length > 1 && <select value={auth.activeCompanyId} onChange={e => void switchCompany(e.target.value)} className="mt-2 w-full rounded-lg border border-[#E5DACD] bg-white px-2 py-1 text-xs">{auth.companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select>}
        </div>
        <div className="flex items-center justify-between px-2 text-xs text-[#7A6453]">
          <div className="flex items-center gap-1.5">
            {serverOnline ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Offline
              </span>
            )}
            {isSyncing && <span className="text-[10px] text-amber-700">(sincronizando)</span>}
          </div>
          <span className="text-[11px] text-[#8C7665]">v1.0.0</span>
        </div>

        <button
          onClick={onOpenTeam}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#5C4533] hover:bg-[#E8DAC6] transition-colors"
        ><Users className="w-4 h-4 text-[#8C7665]"/><span>Equipe</span></button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#5C4533] hover:bg-[#E8DAC6] transition-colors"
        >
          <SettingsIcon className="w-4 h-4 text-[#8C7665]" />
          <span>Configurações & Backup</span>
        </button>
        <button onClick={() => void logout()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50"><LogOut className="w-4 h-4"/>Sair</button>
      </div>
    </aside>
  );
};
