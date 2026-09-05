import React, { useEffect, useState } from 'react';
import { Download, ShieldCheck, Store } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api, AccountDeletionStatus } from '../../services/api';
import { maskPhone } from '../../services/formatters';
import { AppHeader } from '../layout/AppHeader';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, TextInput } from '../ui/Input';
import { DeleteAccountDialog } from './DeleteAccountDialog';

export const SettingsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings, updateSettingsAction, showToast } = useApp();
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(maskPhone(settings.storePhone));
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixKeyType, setPixKeyType] = useState(settings.pixKeyType);
  const [automaticDeliveryReminders, setAutomaticDeliveryReminders] = useState(
    settings.automaticDeliveryReminders ?? false,
  );
  const [automaticPaymentReminders, setAutomaticPaymentReminders] = useState(
    settings.automaticPaymentReminders ?? false,
  );
  const [deliveryReminderHours, setDeliveryReminderHours] = useState(
    settings.deliveryReminderHours ?? 24,
  );
  const [paymentReminderDays, setPaymentReminderDays] = useState(settings.paymentReminderDays ?? 1);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletion, setDeletion] = useState<AccountDeletionStatus | null>(null);

  useEffect(() => {
    void api
      .getDeletionStatus()
      .then(setDeletion)
      .catch(() => undefined);
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updateSettingsAction({
        storeName: storeName.trim() || 'Confeiti',
        storePhone: storePhone.trim(),
        pixKey: pixKey.trim(),
        pixKeyType: pixKeyType.trim(),
        defaultProfitMargin: settings.defaultProfitMargin,
        automaticDeliveryReminders,
        automaticPaymentReminders,
        deliveryReminderHours,
        paymentReminderDays,
      });
    } finally {
      setSaving(false);
    }
  };

  const exportBackup = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = new Blob([JSON.stringify(await api.getBackup(), null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `confeiti_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Backup exportado com sucesso!');
    } catch {
      showToast('Não foi possível exportar o backup.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const requestDeletion = async () => {
    setDeletion(await api.requestDeletion());
    showToast('Exclusão agendada. Você pode recuperar a empresa por 90 dias.', 'info');
  };

  const cancelDeletion = async () => {
    setDeletion(await api.cancelDeletion());
    showToast('Exclusão cancelada. Seus dados continuam disponíveis.');
  };

  return (
    <>
      <AppHeader title="Configurações & Backup" showBack onBack={onBack} />
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
        <section className="rounded-3xl bg-[#72203F] p-6 text-white shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
            Preferências da loja
          </p>
          <h1 className="mt-2 text-3xl font-bold">Configurações da confeitaria</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Mantenha seus dados de contato, recebimentos e cópias de segurança sempre atualizados.
          </p>
        </section>
        <Card className="border-[#E8DECF] bg-white p-5 md:p-6">
          <form onSubmit={(event) => void save(event)} className="space-y-5">
            <div className="flex items-center gap-2 text-[#72203F]">
              <Store className="h-5 w-5" />
              <h2 className="text-lg font-bold">Dados da confeitaria</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Nome do negócio"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                placeholder="Ex.: Confeiti"
                required
              />
              <TextInput
                label="WhatsApp da loja"
                type="tel"
                value={storePhone}
                onChange={(event) => setStorePhone(maskPhone(event.target.value))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Tipo da chave Pix">
                <select
                  className="w-full bg-transparent text-base font-medium text-[#302116] focus:outline-none"
                  value={pixKeyType}
                  onChange={(event) => setPixKeyType(event.target.value)}
                >
                  <option value="E-mail">E-mail</option>
                  <option value="Telefone">Telefone</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="Aleatória">Aleatória</option>
                </select>
              </FormField>
              <div className="md:col-span-2">
                <TextInput
                  label="Chave Pix para pagamentos"
                  value={pixKey}
                  onChange={(event) => setPixKey(event.target.value)}
                  placeholder="suachave@email.com"
                />
              </div>
            </div>
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar configurações'}
            </Button>
          </form>
        </Card>
        <Card className="border-[#E8DECF] bg-white p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#72203F]">Lembretes automáticos</h2>
            <p className="mt-1 text-sm text-[#8C7665]">
              O Confeiti prepara lembretes na fila para você abrir no WhatsApp sem duplicar avisos.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-[#E8DECF] p-4 text-sm">
              <input
                type="checkbox"
                checked={automaticDeliveryReminders}
                onChange={(event) => setAutomaticDeliveryReminders(event.target.checked)}
                className="mt-1 accent-[#96315C]"
              />
              <span>
                <strong className="block text-[#302116]">Lembrete de entrega</strong>
                <span className="text-[#8C7665]">Avisar antes da data combinada.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl border border-[#E8DECF] p-4 text-sm">
              <input
                type="checkbox"
                checked={automaticPaymentReminders}
                onChange={(event) => setAutomaticPaymentReminders(event.target.checked)}
                className="mt-1 accent-[#96315C]"
              />
              <span>
                <strong className="block text-[#302116]">Lembrete de cobrança</strong>
                <span className="text-[#8C7665]">Lembrar pedidos com saldo pendente.</span>
              </span>
            </label>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Antecedência da entrega">
              <select
                className="w-full bg-transparent text-base font-medium text-[#302116] focus:outline-none"
                value={deliveryReminderHours}
                onChange={(event) => setDeliveryReminderHours(Number(event.target.value))}
              >
                <option value={12}>12 horas</option>
                <option value={24}>24 horas</option>
                <option value={48}>48 horas</option>
                <option value={72}>72 horas</option>
              </select>
            </FormField>
            <FormField label="Lembrar cobrança com antecedência">
              <select
                className="w-full bg-transparent text-base font-medium text-[#302116] focus:outline-none"
                value={paymentReminderDays}
                onChange={(event) => setPaymentReminderDays(Number(event.target.value))}
              >
                <option value={1}>1 dia</option>
                <option value={2}>2 dias</option>
                <option value={3}>3 dias</option>
              </select>
            </FormField>
          </div>
        </Card>
        <Card className="border-[#E8DECF] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#72203F]">
                <Download className="h-5 w-5" />
                <h2 className="text-lg font-bold">Backup e sincronização</h2>
              </div>
              <p className="mt-1 text-sm text-[#8C7665]">
                Baixe uma cópia dos dados da sua confeitaria para guardar com segurança.
              </p>
            </div>
            <Button variant="secondary" disabled={exporting} onClick={() => void exportBackup()}>
              {exporting ? 'Preparando…' : 'Baixar backup JSON'}
            </Button>
          </div>
        </Card>
        <Card className="border-rose-200 bg-rose-50/40 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-rose-700" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-rose-800">Privacidade e LGPD</h2>
              {deletion?.deletionScheduledFor ? (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#6B4D4D]">
                    Exclusão agendada para{' '}
                    <strong>
                      {new Date(deletion.deletionScheduledFor).toLocaleDateString('pt-BR')}
                    </strong>
                    . Recupere a empresa antes dessa data.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => void cancelDeletion()}>
                    Cancelar exclusão
                  </Button>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#6B4D4D]">
                    Cancele a empresa e agende sua inativação. Os dados ficam recuperáveis por 90
                    dias.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                    Excluir dados
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      <DeleteAccountDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={requestDeletion}
      />
    </>
  );
};
