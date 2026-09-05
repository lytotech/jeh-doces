import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormField, TextInput } from '../ui/Input';
import { api, AccountDeletionStatus, BillingStatus, PixPayment } from '../../services/api';
import { Download, Store, ShieldCheck, CreditCard, Copy, Check, Lock } from 'lucide-react';
import { maskPhone } from '../../services/formatters';
import { CancelSubscriptionDialog } from '../billing/CancelSubscriptionDialog';
import { DeleteAccountDialog } from './DeleteAccountDialog';

interface BackupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupSettingsModal: React.FC<BackupSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettingsAction, showToast } = useApp();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(maskPhone(settings.storePhone));
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixKeyType, setPixKeyType] = useState(settings.pixKeyType);
  const [defaultMargin] = useState(settings.defaultProfitMargin.toString());
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletion, setDeletion] = useState<AccountDeletionStatus | null>(null);
  const basicFeatures = ['Painel e encomendas', 'Clientes e calendário', 'Produtos e receitas', 'Ingredientes e estoque'];
  const completeFeatures = ['Custos, margem e lucro', 'Busca e categorias persistentes', 'Duplicação de produtos', 'Links públicos e exportação em PDF', 'Pagamentos, backup e relatórios', 'Equipe e recursos avançados'];

  React.useEffect(() => {
    if (isOpen) void api.getBilling().then(setBilling).catch(() => undefined);
    if (isOpen) void api.getDeletionStatus().then(setDeletion).catch(() => undefined);
  }, [isOpen]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updateSettingsAction({
        storeName: storeName.trim() || 'Confeiti',
        storePhone: storePhone.trim(),
        pixKey: pixKey.trim(),
        pixKeyType: pixKeyType.trim(),
        defaultProfitMargin: parseFloat(defaultMargin) || 100,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const jsonStr = JSON.stringify(await api.getBackup(), null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jeh_doces_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Backup exportado com sucesso!');
    } finally {
      setExporting(false);
    }
  };

  const startPayment = async (plan: 'monthly' | 'annual') => {
    setBillingLoading(true);
    try { setPixPayment(await api.createPixPayment(plan)); } finally { setBillingLoading(false); }
  };

  const cancelRenewal = async () => {
    setBillingLoading(true);
    try { setBilling(await api.cancelBilling()); } finally { setBillingLoading(false); }
  };
  const requestDeletion = async () => { setDeletion(await api.requestDeletion()); setBilling(await api.getBilling()); };
  const cancelDeletion = async () => { setDeletion(await api.cancelDeletion()); showToast('Exclusão cancelada. Seus dados continuam disponíveis.'); };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações & Backup"
      subtitle="Personalize sua loja e faça cópias de segurança"
      maxWidth="lg"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#EADDE2] bg-white p-4">
          <h4 className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Meu plano</h4>
          {billing && billing.plan === 'basic' ? (
            <div className="mt-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#302116]">Plano Básico</p><p className="text-xs text-[#7A6453]">Recursos essenciais liberados.</p></div><div className="flex gap-2"><Button size="sm" disabled={billingLoading} onClick={() => void startPayment('monthly')}>R$ 19,80/mês</Button><Button size="sm" disabled={billingLoading} onClick={() => void startPayment('annual')}>R$ 179,80/ano</Button></div></div><p className="mt-3 text-[11px] text-[#8A7565]">Limites: 10 produtos, 20 materiais, 30 ingredientes, 20 encomendas por mês e 1 usuário.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{basicFeatures.map((feature) => <span key={feature} className="flex items-center gap-2 text-xs text-[#5C4533]"><Check className="h-3.5 w-3.5 text-emerald-600" />{feature}</span>)}{completeFeatures.map((feature) => <span key={feature} className="flex items-center gap-2 text-xs text-[#9A8A80]"><Lock className="h-3.5 w-3.5" />{feature} <em className="not-italic text-[10px]">(Completo)</em></span>)}</div></div>
          ) : billing ? (
            <div className="mt-3"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-[#302116]">Plano Completo <span className="ml-1 text-xs font-normal text-emerald-700">Ativo</span></p><p className="text-xs text-[#7A6453]">Válido até {billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString('pt-BR') : '—'}</p></div>{billing.status !== 'canceled' && <Button variant="outline" size="sm" disabled={billingLoading} onClick={() => setCancelOpen(true)}>Cancelar renovação</Button>}</div><div className="mt-4 grid gap-2 sm:grid-cols-2">{[...basicFeatures, ...completeFeatures].map((feature) => <span key={feature} className="flex items-center gap-2 text-xs text-[#5C4533]"><Check className="h-3.5 w-3.5 text-emerald-600" />{feature}</span>)}</div></div>
          ) : <p className="mt-3 text-sm text-[#7A6453]">Carregando assinatura…</p>}
          {billing?.payments?.length ? <div className="mt-4 border-t border-[#EADDE2] pt-3"><p className="text-xs font-bold uppercase tracking-wider text-[#7A4B1D]">Histórico de cobranças</p><div className="mt-2 space-y-2">{billing.payments.map((item) => <div key={item.mercadoPagoId} className="flex items-center justify-between text-xs"><span className="text-[#756878]">{item.plan === 'annual' ? 'Anual' : 'Mensal'} · {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span><span className={item.status === 'approved' ? 'font-semibold text-emerald-700' : 'text-amber-700'}>R$ {item.amount.toFixed(2).replace('.', ',')} · {item.status === 'approved' ? 'Pago' : 'Pendente'}</span></div>)}</div></div> : null}
          {pixPayment?.qrCode && <div className="mt-4 border-t border-[#EADDE2] pt-4 text-center"><p className="text-sm font-semibold text-[#302116]">Pix gerado — R$ {pixPayment.amount.toFixed(2).replace('.', ',')}</p>{pixPayment.qrCodeBase64 && <img src={`data:image/png;base64,${pixPayment.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto mt-2 h-36 w-36" />}<button type="button" onClick={() => void navigator.clipboard.writeText(pixPayment.qrCode!)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7E5EA] px-3 py-2 text-xs font-bold text-[#63304B]"><Copy className="h-3.5 w-3.5" /> Copiar código Pix</button></div>}
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
          <h4 className="text-xs uppercase font-bold text-rose-700 tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Privacidade e LGPD</h4>
          {deletion?.deletionScheduledFor ? <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#6B4D4D]">Exclusão agendada para <strong>{new Date(deletion.deletionScheduledFor).toLocaleDateString('pt-BR')}</strong>. Você pode recuperar a empresa antes dessa data.</p><Button variant="outline" size="sm" onClick={() => void cancelDeletion()}>Cancelar exclusão</Button></div> : <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#6B4D4D]">Cancele o plano e agende a inativação da empresa. Seus dados ficam recuperáveis por 90 dias.</p><Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>Excluir dados e cancelar plano</Button></div>}
        </section>

        {/* Form Configurações */}
        <form onSubmit={handleSaveSettings} className="space-y-3.5">
          <h4 className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" /> Dados da Confeitaria
          </h4>

          <TextInput
            label="Nome do Negócio"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Ex: Confeiti"
            required
          />

          <TextInput
            label="WhatsApp da Loja"
            type="tel"
            value={storePhone}
            onChange={(e) => setStorePhone(maskPhone(e.target.value))}
            placeholder="(11) 99999-9999"
          />

          <div className="grid gap-2 sm:grid-cols-3">
            <FormField label="Tipo Chave">
              <select
                className="w-full rounded-lg bg-[#FFFCF8] text-[#302116] font-medium text-base focus:outline-none"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value)}
              >
                <option value="E-mail">E-mail</option>
                <option value="Telefone">Telefone</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="Aleatória">Aleatória</option>
              </select>
            </FormField>
            <div className="col-span-2">
              <TextInput
                label="Chave Pix para Pagamentos"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="suachave@email.com"
              />
            </div>
          </div>

          <Button disabled={saving} type="submit" fullWidth size="md">
            {saving ? 'Salvando…' : 'Salvar Configurações'}
          </Button>
        </form>

        {/* Exportação de dados */}
        <div className="pt-4 border-t border-[#E5DACD] space-y-3">
          <h4 className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Backup & Sincronização
          </h4>

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={handleExport}
              className="flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> {exporting ? 'Preparando…' : 'Baixar Backup JSON'}
            </Button>
          </div>
        </div>
      </div>
      <CancelSubscriptionDialog isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancelRenewal} />
      <DeleteAccountDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={requestDeletion} />
    </Modal>
  );
};
