import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Input';
import { api } from '../../services/api';
import {
  Download,
  Store,
  QrCode,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface BackupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupSettingsModal: React.FC<BackupSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettingsAction, showToast } = useApp();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixKeyType, setPixKeyType] = useState(settings.pixKeyType);
  const [defaultMargin, setDefaultMargin] = useState(settings.defaultProfitMargin.toString());

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsAction({
      storeName: storeName.trim() || 'Jeh Doces',
      storePhone: storePhone.trim(),
      pixKey: pixKey.trim(),
      pixKeyType: pixKeyType.trim(),
      defaultProfitMargin: parseFloat(defaultMargin) || 100,
    });
    onClose();
  };

  const handleExport = async () => {
    const jsonStr = JSON.stringify(await api.getBackup(), null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jeh_doces_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup exportado com sucesso!');
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações & Backup"
      subtitle="Personalize sua loja e faça cópias de segurança"
      maxWidth="md"
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
            placeholder="Ex: Jeh Doces"
            required
          />

          <TextInput
            label="WhatsApp da Loja"
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#7A6453] mb-1">Tipo Chave</label>
              <select
                className="w-full px-2 py-3 bg-[#FCFAF8] border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-xs font-semibold text-[#302116]"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value)}
              >
                <option value="E-mail">E-mail</option>
                <option value="Telefone">Telefone</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="Aleatória">Aleatória</option>
              </select>
            </div>
            <div className="col-span-2">
              <TextInput
                label="Chave Pix para Pagamentos"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="suachave@email.com"
              />
            </div>
          </div>

          <Button type="submit" fullWidth size="md">
            Salvar Configurações
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
              onClick={handleExport}
              className="flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Baixar Backup JSON
            </Button>

          </div>
        </div>
      </div>
    </Modal>
  );
};
