import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { env } from '../../config/env';
import { DatabaseService } from '../../infrastructure/database/database.service';

type CatalogOrderBody = {
  customer?: { name?: unknown; phone?: unknown };
  items?: unknown;
  notes?: unknown;
  deliveryDate?: unknown;
  submissionId?: unknown;
  captchaToken?: unknown;
  website?: unknown;
};

const turnstileEndpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string, remoteIp?: string) {
  if (!env.turnstileSecretKey && process.env.NODE_ENV !== 'production') return true;
  if (!env.turnstileSecretKey || !token) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(turnstileEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.turnstileSecretKey,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

@Controller('api/public/catalog')
export class PublicCatalogController {
  private readonly logger = new Logger(PublicCatalogController.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Get(':slug')
  async getCatalog(@Param('slug') slug: string) {
    const catalog = await this.database.database.getPublicCatalog(slug);
    if (!catalog) throw new NotFoundException('Catálogo não encontrado.');
    return catalog;
  }

  @Post(':slug/orders')
  async createOrder(
    @Param('slug') slug: string,
    @Body() body: CatalogOrderBody,
    @Req() request: FastifyRequest & { requestId?: string },
  ) {
    if (typeof body.website === 'string' && body.website.trim()) {
      this.logger.warn(
        JSON.stringify({
          event: 'public_form_blocked',
          reason: 'honeypot',
          requestId: request.requestId,
        }),
      );
      throw new BadRequestException('Não foi possível enviar o pedido.');
    }
    const name = typeof body.customer?.name === 'string' ? body.customer.name.trim() : '';
    const phone = typeof body.customer?.phone === 'string' ? body.customer.phone.trim() : '';
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId.trim() : '';
    const captchaToken = typeof body.captchaToken === 'string' ? body.captchaToken : '';
    if (!submissionId || submissionId.length > 80)
      throw new BadRequestException('Identificador de envio inválido.');
    if (name.length < 2) throw new BadRequestException('Informe seu nome.');
    if (name.length > 120) throw new BadRequestException('Nome muito longo.');
    if (phone.length < 8) throw new BadRequestException('Informe um WhatsApp válido.');
    if (phone.length > 30) throw new BadRequestException('WhatsApp inválido.');
    if (!Array.isArray(body.items) || body.items.length === 0)
      throw new BadRequestException('Adicione ao menos um produto.');
    if (body.items.length > 20) throw new BadRequestException('Selecione menos produtos.');
    const items = body.items.map((item) => {
      if (!item || typeof item !== 'object') throw new BadRequestException('Item inválido.');
      const value = item as { productId?: unknown; quantity?: unknown };
      const productId = typeof value.productId === 'string' ? value.productId : '';
      const quantity = Number(value.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99)
        throw new BadRequestException('Quantidade de produto inválida.');
      return { productId, quantity };
    });
    if (new Set(items.map((item) => item.productId)).size !== items.length)
      throw new BadRequestException('Não repita produtos no carrinho.');
    if (typeof body.notes === 'string' && body.notes.length > 2000)
      throw new BadRequestException('Observação muito longa.');
    const deliveryDate = body.deliveryDate ? new Date(String(body.deliveryDate)) : undefined;
    if (deliveryDate && Number.isNaN(deliveryDate.getTime()))
      throw new BadRequestException('Data de entrega inválida.');
    if (deliveryDate) {
      const latestAllowed = new Date();
      latestAllowed.setFullYear(latestAllowed.getFullYear() + 1);
      if (deliveryDate > latestAllowed)
        throw new BadRequestException('Data de entrega muito distante.');
    }
    if (!(await verifyTurnstile(captchaToken, request.ip))) {
      this.logger.warn(
        JSON.stringify({
          event: 'public_form_blocked',
          reason: 'captcha',
          requestId: request.requestId,
        }),
      );
      throw new BadRequestException('Não foi possível validar o envio. Tente novamente.');
    }
    try {
      const order = await this.database.database.createPublicCatalogOrder(slug, {
        customer: { name, phone },
        items,
        submissionId,
        notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : undefined,
        deliveryDate: deliveryDate?.toISOString(),
      });
      if (!order) throw new NotFoundException('Catálogo não encontrado.');
      return order;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Não foi possível enviar o pedido.',
      );
    }
  }
}
