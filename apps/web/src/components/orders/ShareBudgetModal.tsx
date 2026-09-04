import React, { useState } from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { generateWhatsAppQuoteMessage, getWhatsAppUrl } from '../../services/whatsappExporter';
import { Copy, Check, Printer, Send, Share2 } from 'lucide-react';

interface ShareBudgetModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareBudgetModal: React.FC<ShareBudgetModalProps> = ({ order, isOpen, onClose }) => {
  const { settings, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const quoteText = generateWhatsAppQuoteMessage(order, settings);
  const whatsappLink = getWhatsAppUrl(order.clientPhone, quoteText);

  const handleCopy = () => {
    navigator.clipboard.writeText(quoteText);
    setCopied(true);
    showToast('Orçamento copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateLink = async () => {
    try {
      const { api } = await import('../../services/api');
      const { token } = await api.createOrderShareLink(order.id);
      const url = `${window.location.origin}/pedido/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      showToast('Link do pedido copiado!');
    } catch {
      showToast('Não foi possível gerar o link.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Orçamento"
      subtitle={`Cliente: ${order.clientName} (${order.orderNumber})`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <article className="print-quote" aria-hidden="true">
          <header className="print-quote-header">
            <h1>{settings.storeName || 'Confeiti'}</h1>
            <p>Orçamento da sua encomenda</p>
            <p>Entrega: {new Date(order.deliveryDate).toLocaleString('pt-BR')}</p>
          </header>
          <section className="print-quote-section">
            <h2>Dados do cliente</h2>
            <p>{order.clientName}</p>
            {order.clientPhone && <p>{order.clientPhone}</p>}
            {order.clientAddress && <p>{order.clientAddress}</p>}
          </section>
          <section className="print-quote-section">
            <h2>Itens</h2>
            {order.items.map((item) => (
              <div className="print-quote-row" key={item.id}>
                <span>{item.productName}</span>
                <span>
                  {item.quantity}×{' '}
                  {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{' '}
                  &nbsp;{' '}
                  {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </section>
          <section className="print-quote-totals">
            <div>
              <span>Subtotal</span>
              <strong>
                {order.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
            {order.discount > 0 && (
              <div>
                <span>Desconto</span>
                <strong>
                  - {order.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </div>
            )}
            <div className="print-quote-total">
              <span>Total cobrado</span>
              <strong>
                {order.totalCharged.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </section>
          <footer>Gerado por {settings.storeName || 'Confeiti'}</footer>
        </article>
        {/* Preview Container */}
        <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#DFCFC0] max-h-72 overflow-y-auto font-mono text-xs text-[#3D2C1E] whitespace-pre-wrap leading-relaxed shadow-inner">
          {quoteText}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 text-sm px-4 py-3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm active:scale-[0.98]"
          >
            <Send className="w-4 h-4" /> Enviar WhatsApp
          </a>

          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Texto'}
          </Button>

          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </Button>
        </div>
        <div className="border-t border-[#E5DACD] pt-3 space-y-2">
          <Button variant="outline" fullWidth onClick={handleCreateLink}>
            <Share2 className="w-4 h-4" /> Gerar link para o cliente
          </Button>
          {shareUrl && (
            <div className="text-xs text-[#7A6453] break-all bg-white border border-[#E5DACD] rounded-xl p-3">
              {shareUrl}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
