import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }

export const InstallAppPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('jeh-install-dismissed')) return;
    const handler = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallPromptEvent); setVisible(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!visible || !installEvent) return null;
  const install = async () => { await installEvent.prompt(); await installEvent.userChoice; setVisible(false); setInstallEvent(null); };
  const dismiss = () => { localStorage.setItem('jeh-install-dismissed', '1'); setVisible(false); };
  return <div className="fixed bottom-24 left-4 right-4 z-50 flex items-start gap-3 rounded-2xl border border-[#E5DACD] bg-white p-4 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:w-96"><img src="/confeiti-app-icon.png" alt="Confeiti" className="h-10 w-10 shrink-0 rounded-xl" /><div className="flex-1"><p className="text-sm font-semibold text-[#302116]">Instale o Confeiti</p><p className="mt-1 text-xs text-[#7A6453]">Acesse mais rápido pelo celular, mesmo pela tela inicial.</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void install}><Download className="h-3.5 w-3.5" /> Instalar</Button><button onClick={dismiss} className="px-2 text-xs text-[#7A6453]">Agora não</button></div></div><button onClick={dismiss} aria-label="Fechar" className="text-[#A89484]"><X className="h-4 w-4" /></button></div>;
};
