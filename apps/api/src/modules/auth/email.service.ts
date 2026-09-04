import { Inject, Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { PrismaService } from '../../infrastructure/database/prisma.service';

interface EmailContent {
  greeting: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  expiry: string;
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );

@Injectable()
export class EmailService {
  private transporter?: Transporter;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async sendVerification(to: string, name: string, link: string, companyId: string) {
    return this.send(to, 'Confirme seu e-mail — Confeiti', companyId, {
      greeting: `Olá, ${name}!`,
      message: 'Confirme seu e-mail para acessar sua conta no Confeiti.',
      actionLabel: 'Confirmar meu e-mail',
      actionUrl: link,
      expiry: 'Este link expira em 24 horas.',
    });
  }

  async sendPasswordReset(to: string, name: string, link: string, companyId?: string) {
    return this.send(to, 'Redefina sua senha — Confeiti', companyId, {
      greeting: `Olá, ${name}!`,
      message: 'Recebemos uma solicitação para criar uma nova senha para sua conta.',
      actionLabel: 'Criar nova senha',
      actionUrl: link,
      expiry: 'Este link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.',
    });
  }

  async sendInvitation(to: string, inviter: string, link: string, companyId: string) {
    return this.send(to, 'Você recebeu um convite — Confeiti', companyId, {
      greeting: 'Olá!',
      message: `${inviter} convidou você para fazer parte da equipe no Confeiti.`,
      actionLabel: 'Aceitar convite',
      actionUrl: link,
      expiry: 'Este convite é válido por 7 dias.',
    });
  }

  private async send(
    to: string,
    subject: string,
    companyId: string | undefined,
    content: EmailContent,
  ) {
    const setting = companyId
      ? await this.prisma.client.setting.findUnique({ where: { companyId } })
      : null;
    const storeName = setting?.storeName?.trim() || 'Confeiti';
    const storePhone = setting?.storePhone?.trim();
    const text = [
      content.greeting,
      content.message,
      `${content.actionLabel}: ${content.actionUrl}`,
      content.expiry,
    ].join('\n\n');

    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV EMAIL] ${to}: ${text}`);
        return;
      }
      throw new Error('SMTP não configurado; e-mail não enviado.');
    }

    this.transporter ??= nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html: this.renderHtml(storeName, storePhone, content),
    });
  }

  private renderHtml(storeName: string, storePhone: string | undefined, content: EmailContent) {
    const safeStoreName = escapeHtml(storeName);
    const safePhone = storePhone ? escapeHtml(storePhone) : '';
    return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#faf7f2;color:#382b20;font-family:Arial,sans-serif"><div style="max-width:560px;margin:32px auto;padding:0 16px"><div style="background:#8d3157;border-radius:20px 20px 0 0;padding:28px 32px;color:#fff"><div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;opacity:.82">Confeiti</div><h1 style="margin:8px 0 0;font-size:25px">${safeStoreName}</h1></div><div style="background:#fff;border:1px solid #eadde2;border-top:0;border-radius:0 0 20px 20px;padding:32px"><p style="font-size:18px;font-weight:700;margin:0 0 14px">${escapeHtml(content.greeting)}</p><p style="font-size:15px;line-height:1.6;margin:0 0 24px">${escapeHtml(content.message)}</p><p style="margin:0 0 24px"><a href="${escapeHtml(content.actionUrl)}" style="display:inline-block;background:#8d3157;color:#fff;text-decoration:none;border-radius:12px;padding:14px 22px;font-weight:700">${escapeHtml(content.actionLabel)}</a></p><p style="font-size:13px;line-height:1.5;color:#8c7665;margin:0">${escapeHtml(content.expiry)}</p></div><p style="text-align:center;color:#8c7665;font-size:12px;line-height:1.5">Enviado por ${safeStoreName}${safePhone ? ` · ${safePhone}` : ''}<br>Gestão para negócios doces · Confeiti</p></div></body></html>`;
  }
}
