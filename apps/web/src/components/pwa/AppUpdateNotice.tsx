import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { appUpdateService } from '../../services/appUpdate';

export const AppUpdateNotice: React.FC = () => {
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);

  useEffect(() => appUpdateService.start(setAvailableVersion), []);

  const close = () => setAvailableVersion(null);
  const reload = () => window.location.reload();

  return (
    <Modal
      isOpen={Boolean(availableVersion)}
      onClose={close}
      title="Nova versão disponível"
      subtitle="Atualização do Confeiti"
      maxWidth="sm"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F4E5EA] text-[#8D3157]">
            <RefreshCw className="h-5 w-5" />
          </div>
          <p className="pt-1 text-sm leading-6 text-[#5C4533]">
            Uma nova versão do sistema está pronta. Atualize agora para receber as últimas
            melhorias.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Depois
          </Button>
          <Button type="button" onClick={reload}>
            Atualizar agora
          </Button>
        </div>
      </div>
    </Modal>
  );
};
