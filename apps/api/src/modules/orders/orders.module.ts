import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AuthModule } from '../auth/auth.module';
import { OrderPdfService } from './order-pdf.service';

@Module({ imports: [AuthModule], controllers: [OrdersController], providers: [OrderPdfService] })
export class OrdersModule {}
