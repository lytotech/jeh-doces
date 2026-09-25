import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

type CatalogOrderBody = {
  customer?: { name?: unknown; phone?: unknown };
  items?: unknown;
  notes?: unknown;
  deliveryDate?: unknown;
};

@Controller('api/public/catalog')
export class PublicCatalogController {
  constructor(private readonly database: DatabaseService) {}

  @Get(':slug')
  async getCatalog(@Param('slug') slug: string) {
    const catalog = await this.database.database.getPublicCatalog(slug);
    if (!catalog) throw new NotFoundException('Catálogo não encontrado.');
    return catalog;
  }

  @Post(':slug/orders')
  async createOrder(@Param('slug') slug: string, @Body() body: CatalogOrderBody) {
    const name = typeof body.customer?.name === 'string' ? body.customer.name.trim() : '';
    const phone = typeof body.customer?.phone === 'string' ? body.customer.phone.trim() : '';
    if (name.length < 2) throw new BadRequestException('Informe seu nome.');
    if (phone.length < 8) throw new BadRequestException('Informe um WhatsApp válido.');
    if (!Array.isArray(body.items) || body.items.length === 0)
      throw new BadRequestException('Adicione ao menos um produto.');
    const items = body.items.map((item) => {
      if (!item || typeof item !== 'object') throw new BadRequestException('Item inválido.');
      const value = item as { productId?: unknown; quantity?: unknown };
      const productId = typeof value.productId === 'string' ? value.productId : '';
      const quantity = Number(value.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99)
        throw new BadRequestException('Quantidade de produto inválida.');
      return { productId, quantity };
    });
    const deliveryDate = body.deliveryDate ? new Date(String(body.deliveryDate)) : undefined;
    if (deliveryDate && Number.isNaN(deliveryDate.getTime()))
      throw new BadRequestException('Data de entrega inválida.');
    try {
      const order = await this.database.database.createPublicCatalogOrder(slug, {
        customer: { name, phone },
        items,
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
