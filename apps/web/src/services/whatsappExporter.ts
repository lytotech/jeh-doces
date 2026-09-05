import { Order, AppSettings } from '../types';
import { formatCurrency, formatDateTime } from './costEngine';

export const generateWhatsAppQuoteMessage = (order: Order, settings: AppSettings): string => {
  const totalPaid = (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, order.totalCharged - totalPaid);

  let message = `🧁 *${settings.storeName.toUpperCase()} - ORÇAMENTO / ENCOMENDA*\n`;
  message += `------------------------------------\n`;
  message += `*Pedido:* ${order.orderNumber}\n`;
  message += `*Cliente:* ${order.clientName}\n`;
  message += `*Data/Hora de Entrega:* ${formatDateTime(order.deliveryDate)}\n`;
  if (order.clientAddress) {
    message += `*Endereço:* ${order.clientAddress}\n`;
  }
  message += `------------------------------------\n\n`;

  message += `📦 *ITENS DO PEDIDO:*\n`;
  order.items.forEach((item, index) => {
    message += `${index + 1}. *${item.productName}*\n`;
    message += `   ${item.quantity}x de ${formatCurrency(item.unitPrice)} = *${formatCurrency(item.totalPrice)}*\n`;
  });

  if (order.materials && order.materials.length > 0) {
    message += `\n🎀 *EMBALAGENS & MATERIAIS INCLUSOS:*\n`;
    order.materials.forEach((mat) => {
      message += `- ${mat.materialName} (${mat.quantity} un)\n`;
    });
  }

  message += `\n------------------------------------\n`;
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
    message += `\n🔑 *CHAVE PIX PARA PAGAMENTO:*\n`;
    message += `*Tipo:* ${settings.pixKeyType || 'Chave'}\n`;
    message += `*Chave:* ${settings.pixKey}\n`;
  }

  if (order.notes) {
    message += `\n📝 *Observações:* ${order.notes}\n`;
  }

  message += `\nMuito obrigado pela preferência! Ficamos felizes em adoçar o seu momento! ✨`;

  return message;
};

const STATUS_MESSAGES: Record<Order['status'], string> = {
  orcamento: 'Seu orçamento está pronto e aguardando sua confirmação.',
  confirmado: 'Sua encomenda foi confirmada e já está reservada na nossa agenda.',
  produzindo: 'Sua encomenda já está em produção. Estamos preparando tudo com carinho!',
  pronto: 'Sua encomenda está pronta para retirada ou entrega.',
  entregue: 'Sua encomenda foi marcada como entregue. Muito obrigado pela preferência!',
  cancelado: 'Sua encomenda foi cancelada. Se precisar, estamos à disposição para ajudar.',
};

/** Creates a short, reusable customer update for the order's current status. */
export const generateWhatsAppStatusMessage = (order: Order, settings: AppSettings): string => {
  const statusMessage = STATUS_MESSAGES[order.status];
  let message = `Olá, ${order.clientName}! 😊\n\n`;
  message += `Atualização da encomenda *#${order.orderNumber}* - ${settings.storeName}:\n`;
  message += `*Status:* ${statusMessage}\n`;
  message += `*Entrega:* ${formatDateTime(order.deliveryDate)}\n`;
  message += `*Total:* ${formatCurrency(order.totalCharged)}\n`;

  if (order.status !== 'cancelado' && order.notes) {
    message += `\nObservação: ${order.notes}\n`;
  }

  message += `\nSe tiver qualquer dúvida, é só responder por aqui! ✨`;
  return message;
};

export const generateWhatsAppReminderMessage = (
  order: Order,
  settings: AppSettings,
  kind: 'delivery' | 'payment',
): string => {
  const totalPaid = (order.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, order.totalCharged - totalPaid);
  let message = `Olá, ${order.clientName}! 😊\n\n`;
  message += `Lembrete da encomenda *#${order.orderNumber}* - ${settings.storeName}:\n`;

  if (kind === 'delivery') {
    message += `Sua entrega está agendada para *${formatDateTime(order.deliveryDate)}*.\n`;
    message += 'Se precisar ajustar algum detalhe, avise a gente por aqui.\n';
  } else {
    message += `Ainda falta *${formatCurrency(remaining)}* para completar o pagamento.\n`;
    if (settings.pixKey) message += `Chave Pix: *${settings.pixKey}*\n`;
  }

  message += '\nObrigada pela preferência! ✨';
  return message;
};

export const getWhatsAppUrl = (phone: string | undefined, message: string): string => {
  let cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }
  const encoded = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
};
