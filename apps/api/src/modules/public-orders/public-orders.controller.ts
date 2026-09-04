import { Controller, Get, Inject, NotFoundException, Param } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Controller('api/public/orders')
export class PublicOrdersController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get(':token') async get(@Param('token') token: string) {
    const order = await this.database.database.getPublicOrder(token);
    if (!order) throw new NotFoundException('Link inválido ou expirado');
    return order;
  }
}
