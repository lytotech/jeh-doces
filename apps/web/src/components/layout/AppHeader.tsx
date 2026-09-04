import React from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, Edit3, Settings as SettingsIcon } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  onOpenSettings?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack,
  onBack,
  rightAction,
  onOpenSettings,
}) => {
  const { settings } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#B57E44] text-white shadow-md">
      <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="p-1 -ml-1 text-white hover:bg-black/10 rounded-full transition-colors active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-serif font-medium tracking-wide text-white drop-shadow-xs truncate">
            {title || settings.storeName}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightAction}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Configurações"
              className="p-2 text-white/90 hover:text-white hover:bg-black/10 rounded-full transition-colors active:scale-95"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
