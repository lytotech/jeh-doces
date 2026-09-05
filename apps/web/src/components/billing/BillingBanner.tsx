import React from 'react';
import { AlertCircle, Check, Copy, CreditCard, X } from 'lucide-react';
import { api, BillingStatus, PixPayment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function BillingBanner() {
  const { auth } = useAuth();
  const [billing, setBilling] = React.useState<BillingStatus | null>(null);
  const [payment, setPayment] = React.useState<PixPayment | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [dismissedPending, setDismissedPending] = React.useState(false);
  const pendingPaymentKey = billing?.pendingPaymentId || billing?.payments?.find((item) => item.status !== 'approved')?.mercadoPagoId || 'none';
  const dismissKey = `confeiti-pending-banner:${auth?.activeCompanyId || 'default'}:${pendingPaymentKey}`;
  React.useEffect(() => {
    setDismissedPending(window.localStorage.getItem(dismissKey) === 'true');
  }, [dismissKey]);
  React.useEffect(() => {
    let mounted = true;
    void api.getBilling().then((value) => { if (mounted) setBilling(value); }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);
  React.useEffect(() => {
    if (!billing || billing.status !== 'pending' || dismissedPending) return;
    const interval = window.setInterval(() => {
      void api.getBilling().then(setBilling).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [billing?.status, dismissedPending]);
  const createPayment = async (plan: 'monthly' | 'annual') => {
    setLoading(true);
    try { setPayment(await api.createPixPayment(plan)); } finally { setLoading(false); }
  };
  const syncPayment = async () => {
    setSyncing(true);
    try {
      setBilling(await api.syncBilling());
    } finally {
      setSyncing(false);
    }
  };
  const dismissPending = () => {
    window.localStorage.setItem(dismissKey, 'true');
    setDismissedPending(true);
  };
  if (!billing) return null;
  const active = billing.plan !== 'basic' && billing.currentPeriodEnd && new Date(billing.currentPeriodEnd) > new Date();
  if (active) return null;
  if (billing.status === 'pending' && dismissedPending) return null;
  return (
    <>
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#E7B84B] bg-[#FFFDF2] p-3 text-[#654A12] shadow-lg shadow-[#654A12]/10 md:bottom-5 md:right-6">
        <div className="flex items-start gap-2.5 pr-5">
          <AlertCircle className="mt-0.5 shrink-0 text-[#B17B13]" size={17} />
          <div className="min-w-0 flex-1 text-xs leading-relaxed"><strong className="font-bold">{billing.status === 'pending' ? 'Pagamento pendente' : 'Plano Básico'}</strong><span className="ml-1 text-[#806B36]">· Assine para liberar todos os recursos.</span></div>
        </div>
        {billing.status === 'pending' && <button type="button" aria-label="Fechar aviso de pagamento pendente" onClick={dismissPending} className="absolute right-2.5 top-2.5 rounded-lg p-1 text-[#9B7B2B] hover:bg-[#F8EDC7]"><X size={15} /></button>}
        <div className="mt-2.5 flex flex-wrap gap-2 pl-6"><button disabled={loading} onClick={() => void createPayment('monthly')} className="rounded-lg bg-[#8D3157] px-2.5 py-1.5 text-[11px] font-bold text-white">R$ 19,80/mês</button><button disabled={loading} onClick={() => void createPayment('annual')} className="rounded-lg bg-[#6B1F3B] px-2.5 py-1.5 text-[11px] font-bold text-white">R$ 179,80/ano</button>{billing.status === 'pending' && <button disabled={syncing} onClick={() => void syncPayment()} className="rounded-lg border border-[#D9B58D] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#7A4B1D]">{syncing ? 'Consultando...' : 'Já paguei · Atualizar'}</button>}</div>
      </div>
      {payment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"><button onClick={() => setPayment(null)} className="absolute right-4 top-4 text-[#756878]"><X /></button><CreditCard className="mx-auto text-[#8D3157]" size={32} /><h2 className="mt-3 text-xl font-bold text-[#2E2A3D]">Pague com Pix</h2><p className="mt-1 text-sm text-[#756878]">Aponte a câmera para o QR Code ou copie o código.</p>{payment.qrCodeBase64 && <img src={`data:image/png;base64,${payment.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto mt-4 h-52 w-52" />}{payment.qrCode && <button onClick={() => void navigator.clipboard.writeText(payment.qrCode!)} className="mx-auto mt-3 inline-flex items-center gap-2 rounded-xl bg-[#F7E5EA] px-4 py-2 text-xs font-bold text-[#63304B]"><Copy size={14} /> Copiar código Pix</button>}<p className="mt-4 text-xs text-[#756878]"><Check className="mr-1 inline text-emerald-600" size={14} />Após a confirmação, os recursos serão liberados automaticamente.</p></div></div>}
    </>
  );
}
