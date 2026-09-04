import React from 'react';
import { Check, Copy, CreditCard, X } from 'lucide-react';
import { api, BillingStatus, PixPayment } from '../../services/api';

export function BillingBanner() {
  const [billing, setBilling] = React.useState<BillingStatus | null>(null);
  const [payment, setPayment] = React.useState<PixPayment | null>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => { void api.getBilling().then(setBilling).catch(() => undefined); }, []);
  if (!billing || (billing.plan !== 'basic' && billing.status === 'active')) return null;
  const createPayment = async (plan: 'monthly' | 'annual') => {
    setLoading(true);
    try { setPayment(await api.createPixPayment(plan)); } finally { setLoading(false); }
  };
  return (
    <>
      <div className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl border border-[#E7B84B] bg-[#FFF8DE] px-4 py-3 text-sm text-[#654A12] md:mx-8 md:flex-row md:items-center md:justify-between">
        <div><strong>{billing.status === 'pending' ? 'Pagamento pendente.' : 'Você está no plano Básico.'}</strong> Assine para liberar todos os recursos.</div>
        <div className="flex gap-2"><button disabled={loading} onClick={() => void createPayment('monthly')} className="rounded-xl bg-[#8D3157] px-3 py-2 text-xs font-bold text-white">R$ 9,90/mês</button><button disabled={loading} onClick={() => void createPayment('annual')} className="rounded-xl bg-[#6B1F3B] px-3 py-2 text-xs font-bold text-white">R$ 89,90/ano</button></div>
      </div>
      {payment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"><button onClick={() => setPayment(null)} className="absolute right-4 top-4 text-[#756878]"><X /></button><CreditCard className="mx-auto text-[#8D3157]" size={32} /><h2 className="mt-3 text-xl font-bold text-[#2E2A3D]">Pague com Pix</h2><p className="mt-1 text-sm text-[#756878]">Aponte a câmera para o QR Code ou copie o código.</p>{payment.qrCodeBase64 && <img src={`data:image/png;base64,${payment.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto mt-4 h-52 w-52" />}{payment.qrCode && <button onClick={() => void navigator.clipboard.writeText(payment.qrCode!)} className="mx-auto mt-3 inline-flex items-center gap-2 rounded-xl bg-[#F7E5EA] px-4 py-2 text-xs font-bold text-[#63304B]"><Copy size={14} /> Copiar código Pix</button>}<p className="mt-4 text-xs text-[#756878]"><Check className="mr-1 inline text-emerald-600" size={14} />Após a confirmação, os recursos serão liberados automaticamente.</p></div></div>}
    </>
  );
}
