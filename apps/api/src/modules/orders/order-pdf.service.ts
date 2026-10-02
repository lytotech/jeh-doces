import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { AppSettings, Order } from '@jeh-doces/shared';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('pt-BR') : 'A definir';

const safeText = (value: string | undefined | null) => value?.trim() || '';

@Injectable()
export class OrderPdfService {
  async generate(order: Order, settings: AppSettings): Promise<Buffer> {
    const document = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks: Buffer[] = [];

    const finished = new Promise<void>((resolve, reject) => {
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', resolve);
      document.on('error', reject);
    });

    const accent = '#96642f';
    const muted = '#7a6453';
    const line = '#e5dacd';
    const storeName = safeText(settings.storeName) || 'Confeiti';

    document.font('Helvetica-Bold').fontSize(22).fillColor(accent).text(storeName);
    document.moveDown(0.25);
    document.font('Helvetica').fontSize(11).fillColor(muted).text('Orçamento da sua encomenda');
    document.text(`Pedido ${order.orderNumber}`);
    document.text(`Entrega: ${dateTime(order.deliveryDate)}`);
    document.moveDown(1);

    const section = (title: string) => {
      document
        .moveTo(document.page.margins.left, document.y)
        .lineTo(document.page.width - document.page.margins.right, document.y)
        .strokeColor(line)
        .stroke();
      document.moveDown(0.45);
      document.font('Helvetica-Bold').fontSize(10).fillColor(accent).text(title.toUpperCase());
      document.moveDown(0.35);
    };

    section('Dados do cliente');
    document.font('Helvetica').fontSize(11).fillColor('#302116').text(order.clientName);
    const phone = safeText(order.clientPhone);
    const address = safeText(order.clientAddress);
    if (phone) document.text(phone);
    if (address) document.text(address);
    document.moveDown(1);

    section('Itens');
    for (const item of order.items) {
      const y = document.y;
      document.font('Helvetica').fontSize(10).fillColor('#302116').text(item.productName, {
        width: 270,
      });
      document.font('Helvetica').text(`${item.quantity}× ${currency(item.unitPrice)}`, 340, y, {
        width: 100,
        align: 'right',
      });
      document
        .font('Helvetica-Bold')
        .text(currency(item.totalPrice), 450, y, { width: 90, align: 'right' });
      document.moveDown(0.45);
      document
        .moveTo(document.page.margins.left, document.y)
        .lineTo(document.page.width - document.page.margins.right, document.y)
        .strokeColor('#f0e9e1')
        .stroke();
      document.moveDown(0.45);
    }

    document.moveDown(0.8);
    const totalRow = (label: string, value: string, bold = false) => {
      const y = document.y;
      document
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 13 : 11)
        .fillColor('#302116')
        .text(label, {
          width: 300,
        });
      document
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, 400, y, { width: 140, align: 'right' });
      document.moveDown(bold ? 0.65 : 0.45);
    };

    totalRow('Subtotal', currency(order.subtotal));
    if (order.discount > 0) totalRow('Desconto', `- ${currency(order.discount)}`);
    document
      .moveTo(document.page.margins.left, document.y)
      .lineTo(document.page.width - document.page.margins.right, document.y)
      .strokeColor(accent)
      .lineWidth(1.5)
      .stroke();
    document.moveDown(0.6);
    totalRow('Total cobrado', currency(order.totalCharged), true);

    document.font('Helvetica').fontSize(9).fillColor('#9b8878').text(`Gerado por ${storeName}`, {
      align: 'center',
    });
    document.end();
    await finished;
    return Buffer.concat(chunks);
  }
}
