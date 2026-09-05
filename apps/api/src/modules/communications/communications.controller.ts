import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { getCompanyId, prisma } from '../../infrastructure/database/client';
import { AuthGuard } from '../auth/auth.guard';

const statuses = new Set([
  'orcamento',
  'confirmado',
  'produzindo',
  'pronto',
  'entregue',
  'cancelado',
]);

@Controller('api/communications')
@UseGuards(AuthGuard)
@UseInterceptors(CompanyContextInterceptor)
export class CommunicationsController {
  @Get('orders/:orderId')
  list(@Param('orderId') orderId: string) {
    return prisma.communication.findMany({
      where: { companyId: getCompanyId(), orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() body: any) {
    const status = typeof body?.status === 'string' ? body.status : '';
    const template = typeof body?.template === 'string' ? body.template.trim() : '';
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    if (!orderId || !statuses.has(status) || !template) {
      throw new BadRequestException('Dados da comunicação inválidos.');
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: getCompanyId() },
    });
    if (!order) throw new BadRequestException('Encomenda não encontrada.');

    return prisma.communication.create({
      data: {
        companyId: getCompanyId(),
        orderId,
        channel: 'whatsapp',
        template: template.slice(0, 80),
        status: status as any,
        recipient: typeof body?.recipient === 'string' ? body.recipient.slice(0, 40) : null,
      },
    });
  }
}
