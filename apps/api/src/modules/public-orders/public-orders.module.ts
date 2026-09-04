import { Module } from '@nestjs/common';
import { PublicOrdersController } from './public-orders.controller';

@Module({ controllers: [PublicOrdersController] })
export class PublicOrdersModule {}
