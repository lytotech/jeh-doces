import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, CreditCard, LockKeyhole, RefreshCw, XCircle } from 'lucide-react';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useApp } from '../../context/AppContext';
import { api, BillingStatus, PixPayment } from '../../services/api';
import { CancelSubscriptionDialog } from './CancelSubscriptionDialog';

const basicFeatures = ['Painel e encomendas', 'Clientes e calendário', 'Produtos e receitas', 'Ingredientes e estoque'];
const completeFeatures = ['Custos, margem e lucro', 'Busca e categorias persistentes', 'Duplicação de produtos', 'Links públicos e exportação em PDF', 'Pagamentos, backup e relatórios', 'Equipe e recursos avançados'];

const money = (amount: number) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';

interface BillingPageProps { onBack: () => void; }

export const BillingPage: React.FC<BillingPageProps> = ({ onBack }) => {
  const { showToast } = useApp();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const refresh = async () => setBilling(await api.getBilling());
  useEffect(() => { void refresh().catch(() => showToast('Não foi possível carregar os dados do plano.', 'error')); }, []);

  const pendingPlan = billing?.pendingPlan === 'annual' ? 'annual' : 'monthly';
  const pendingAmount = pendingPlan === 'annual' ? 179.8 : 19.8;
  const activePlan = billing?.plan === 'annual' ? 'Plano Completo anual' : billing?.plan === 'monthly' ? 'Plano Completo mensal' : 'Plano Básico';
  const isPending = billing?.status === 'pending';
  const isComplete = billing?.plan === 'monthly' || billing?.plan === 'annual';
  const statusLabel = isPending ? 'Pagamento pendente' : billing?.status === 'canceled' ? 'Cancelado' : isComplete ? 'Ativo' : 'Grátis';
  const history = useMemo(() => billing?.payments ?? [], [billing]);

  const createPix = async (plan: 'monthly' | 'annual') => {
    setLoading(true);
    try { setPixPayment(await api.createPixPayment(plan)); showToast('Pix gerado.'); }
    catch { showToast('Não foi possível gerar o Pix.', 'error'); }
    finally { setLoading(false); }
  };

  const startRecurring = async (plan: 'monthly' | 'annual') => {
    setLoading(true);
    try { window.location.assign((await api.createRecurringSubscription(plan)).checkoutUrl); }
    catch { showToast('Não foi possível abrir o checkout.', 'error'); setLoading(false); }
  };

  const sync = async () => {
    setLoading(true);
    try { setBilling(await api.syncBilling()); showToast('Status atualizado.'); }
    catch { showToast('Não foi possível atualizar o status.', 'error'); }
    finally { setLoading(false); }
  };

  const cancelPending = async () => {
    if (!window.confirm('Cancelar esta cobrança pendente?')) return;
    setLoading(true);
    try { setBilling(await api.cancelPendingBilling()); setPixPayment(null); showToast('Cobrança cancelada.'); }
    catch { showToast('Não foi possível cancelar a cobrança.', 'error'); }
    finally { setLoading(false); }
  };

  const cancelRenewal = async () => {
    setLoading(true);
    try { setBilling(await api.cancelBilling()); showToast('Renovação cancelada. Seu acesso continua até o fim do período.'); }
    catch { showToast('Não foi possível cancelar a renovação.', 'error'); }
    finally { setLoading(false); }
  };

  const copyPix = async () => {
    if (!pixPayment?.qrCode) return;
    await navigator.clipboard.writeText(pixPayment.qrCode);
    showToast('Código Pix copiado.');
  };

  return <>
    <AppHeader title="Meu plano" showBack onBack={onBack} rightAction={<Button size="sm" variant="secondary" onClick={() => void sync()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Atualizar status</Button>} />
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <section className="rounded-3xl bg-[#72203F] p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div><p className="text-sm font-semibold uppercase tracking-wider text-white/70">Assinatura Confeiti</p><h1 className="mt-2 text-3xl font-bold">Tenha clareza sobre o seu negócio.</h1><p className="mt-2 max-w-2xl text-sm text-white/80">Gerencie seu plano, pagamentos e os recursos liberados para sua confeitaria em um só lugar.</p></div>
          <div className="rounded-2xl bg-white/10 p-4 md:min-w-56"><p className="text-xs uppercase tracking-wider text-white/70">Plano atual</p><p className="mt-1 text-xl font-bold">{activePlan}</p><span className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{statusLabel}</span></div>
        </div>
      </section>

      <Card className="border-[#E8DECF] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-[#72203F]"><CreditCard className="h-5 w-5" /><h2 className="text-lg font-bold">Situação da assinatura</h2></div><p className="mt-1 text-sm text-[#8C7665]">{isPending ? `Aguardando confirmação do Pix de ${money(pendingAmount)}.` : isComplete ? `Acesso liberado até ${date(billing?.currentPeriodEnd ?? null)}.` : 'Use os recursos essenciais gratuitamente e faça upgrade quando quiser.'}</p></div><div className="flex flex-wrap gap-2">{isPending && <><Button size="sm" onClick={() => void sync()} disabled={loading}>Atualizar pagamento</Button><Button size="sm" variant="secondary" onClick={() => void cancelPending()} disabled={loading}>Cancelar cobrança</Button></>}{isComplete && billing?.status === 'active' && <Button size="sm" variant="secondary" onClick={() => setCancelOpen(true)} disabled={loading}>Cancelar renovação</Button>}</div></div>
      </Card>

      {pixPayment && <Card className="border-[#E8DECF] bg-white p-5 text-center md:p-6"><h2 className="text-lg font-bold text-[#362517]">Pix gerado — {money(pixPayment.amount)}</h2>{pixPayment.qrCodeBase64 && <img className="mx-auto my-4 h-48 w-48" src={`data:image/png;base64,${pixPayment.qrCodeBase64}`} alt="QR Code Pix" />}<div className="mx-auto flex max-w-xl gap-2"><input readOnly value={pixPayment.qrCode ?? ''} className="min-w-0 flex-1 rounded-xl border border-[#E5DACD] bg-[#FAF7F2] px-3 text-xs" /><Button size="sm" variant="secondary" onClick={() => void copyPix()}><Copy className="mr-2 h-4 w-4" />Copiar</Button></div></Card>}

      <section><div className="mb-3"><h2 className="text-xl font-bold text-[#362517]">Escolha o plano ideal</h2><p className="text-sm text-[#8C7665]">Todos os valores são claros e você pode cancelar a renovação quando quiser.</p></div><div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-[#E8DECF] bg-white p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8C7665]">Para começar</p><h3 className="mt-1 text-2xl font-bold text-[#362517]">Plano Básico</h3></div><span className="rounded-full bg-[#F5ECE0] px-3 py-1 text-xs font-semibold text-[#72203F]">Grátis</span></div><p className="mt-3 text-sm text-[#8C7665]">Recursos essenciais para organizar sua produção.</p><ul className="mt-5 space-y-3">{basicFeatures.map((feature) => <li key={feature} className="flex gap-2 text-sm text-[#5C4533]"><Check className="h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}{completeFeatures.map((feature) => <li key={feature} className="flex gap-2 text-sm text-[#A08D7D]"><LockKeyhole className="h-4 w-4 shrink-0" />{feature}</li>)}</ul></Card>
        <Card className="border-[#B57E44] bg-[#FFF9F2] p-6 ring-2 ring-[#F5ECE0]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#B57E44]">Para crescer</p><h3 className="mt-1 text-2xl font-bold text-[#72203F]">Plano Completo</h3></div><span className="rounded-full bg-[#72203F] px-3 py-1 text-xs font-semibold text-white">Recomendado</span></div><p className="mt-3 text-sm text-[#8C7665]">Mais controle, automações e recursos avançados.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><Button size="sm" onClick={() => void createPix('monthly')} disabled={loading}>Pix mensal · R$ 19,80</Button><Button size="sm" onClick={() => void createPix('annual')} disabled={loading}>Pix anual · R$ 179,80</Button><Button size="sm" variant="secondary" onClick={() => void startRecurring('monthly')} disabled={loading}>Automático mensal</Button><Button size="sm" variant="secondary" onClick={() => void startRecurring('annual')} disabled={loading}>Automático anual</Button></div><ul className="mt-5 grid gap-3 sm:grid-cols-2">{completeFeatures.map((feature) => <li key={feature} className="flex gap-2 text-sm text-[#5C4533]"><Check className="h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}</ul></Card>
      </div></section>

      <Card className="border-[#E8DECF] bg-white p-5 md:p-6"><h2 className="text-lg font-bold text-[#362517]">Histórico de cobranças</h2>{history.length === 0 ? <p className="mt-3 text-sm text-[#8C7665]">Nenhuma cobrança registrada.</p> : <div className="mt-3 divide-y divide-[#F0E8DF]">{history.map((payment) => <div key={payment.mercadoPagoId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="capitalize text-[#5C4533]">Plano {payment.plan} · {date(payment.createdAt)}</span><span className={payment.status === 'approved' ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>{money(payment.amount)} · {payment.status === 'approved' ? 'Pago' : 'Pendente'}</span></div>)}</div>}</Card>
    </div>
    <CancelSubscriptionDialog isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancelRenewal} />
  </>;
};
