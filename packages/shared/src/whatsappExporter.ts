import { Order, AppSettings } from './types';
import { formatCurrency, formatDateTime } from './costEngine';

export const generateWhatsAppQuoteMessage = (order: Order, settings: AppSettings): string => {
  const totalPaid = (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, order.totalCharged - totalPaid);

  let message = `*🧁 ${settings.storeName.toUpperCase()} • ORÇAMENTO / ENCOMENDA*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*Pedido:* ${order.orderNumber}\n`;
  message += `*Cliente:* ${order.clientName}\n`;
  message += `*Data/Hora de Entrega:* ${formatDateTime(order.deliveryDate)}\n`;
  if (order.clientAddress) {
    message += `*Endereço:* ${order.clientAddress}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `*📦 ITENS DO PEDIDO:*\n`;
  order.items.forEach((item, index) => {
    message += `${index + 1}. *${item.productName}*\n`;
    message += `   ${item.quantity}x de ${formatCurrency(item.unitPrice)} = *${formatCurrency(item.totalPrice)}*\n`;
  });

  if (order.materials && order.materials.length > 0) {
    message += `\n*🎀 EMBALAGENS & MATERIAIS INCLUSOS:*\n`;
    order.materials.forEach((mat) => {
      message += `• ${mat.materialName} (${mat.quantity} un)\n`;
    });
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*Subtotal:* ${formatCurrency(order.subtotal)}\n`;
  if (order.discount > 0) {
    message += `*Desconto:* -${formatCurrency(order.discount)}\n`;
  }
  message += `*TOTAL:* *${formatCurrency(order.totalCharged)}*\n`;

  if (order.payments && order.payments.length > 0) {
    message += `*Valor já pago:* ${formatCurrency(totalPaid)}\n`;
    message += `*Saldo restante:* *${formatCurrency(remaining)}*\n`;
  }

  if (settings.pixKey) {
    message += `\n*🔑 CHAVE PIX PARA PAGAMENTO:*\n`;
    message += `*Tipo:* ${settings.pixKeyType || 'Chave'}\n`;
    message += `*Chave:* \`${settings.pixKey}\`\n`;
  }

  if (order.notes) {
    message += `\n*📝 Observações:* ${order.notes}\n`;
  }

  message += `\nMuito obrigado pela preferência! Ficamos felizes em adoçar o seu momento! ✨`;

  return message;
};

export const getWhatsAppUrl = (phone: string | undefined, message: string): string => {
  let cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }
  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
};
