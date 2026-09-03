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
  return <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white border border-[#E5DACD] rounded-2xl shadow-2xl p-4 flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-[#F5ECE0] flex items-center justify-center text-xl shrink-0">🧁</div><div className="flex-1"><p className="font-semibold text-[#302116] text-sm">Instale o Jeh Doces</p><p className="text-xs text-[#7A6453] mt-1">Acesse mais rápido pelo celular, mesmo pela tela inicial.</p><div className="flex gap-2 mt-3"><Button size="sm" onClick={() => void install}><Download className="w-3.5 h-3.5" /> Instalar</Button><button onClick={dismiss} className="text-xs text-[#7A6453] px-2">Agora não</button></div></div><button onClick={dismiss} aria-label="Fechar" className="text-[#A89484]"><X className="w-4 h-4" /></button></div>;
};
