import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, NotFoundException, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/orders')
@UseGuards(AuthGuard)
@UseInterceptors(CompanyContextInterceptor)
export class OrdersController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get() getAll() { return this.database.database.getOrders(); }
  @Post() save(@Body() body: any) { return this.database.database.saveOrder(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.database.database.saveOrder({ ...body, id }); }
  @Delete(':id') delete(@Param('id') id: string) { return this.database.database.deleteOrder(id).then(success => ({ success })); }
  @Patch(':id/status') async status(@Param('id') id: string, @Body('status') status: any) { const updated = await this.database.database.updateOrderStatus(id, status); if (!updated) throw new NotFoundException('Order not found'); return updated; }
  @Post(':id/share-link') async share(@Param('id') id: string) { const token = await this.database.database.createOrderShareLink(id); if (!token) throw new NotFoundException('Order not found'); return { token }; }
  @Post(':id/payments') async payment(@Param('id') id: string, @Body() body: any) { const updated = await this.database.database.addPayment(id, body); if (!updated) throw new NotFoundException('Order not found'); return updated; }
  @Delete(':id/payments/:paymentId') async removePayment(@Param('id') id: string, @Param('paymentId') paymentId: string) { const updated = await this.database.database.removePayment(id, paymentId); if (!updated) throw new NotFoundException('Order not found'); return updated; }
}
