import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormField, TextInput } from '../ui/Input';
import { api } from '../../services/api';
import { Download, Store, ShieldCheck } from 'lucide-react';
import { maskPhone } from '../../services/formatters';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações & Backup"
      subtitle="Personalize sua loja e faça cópias de segurança"
      maxWidth="lg"
    >
      <div className="space-y-6">
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
    </Modal>
  );
};
