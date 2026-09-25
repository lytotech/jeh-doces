import { Module } from '@nestjs/common';
import { PublicOrdersController } from './public-orders.controller';
import { PublicCatalogController } from './public-catalog.controller';

@Module({ controllers: [PublicOrdersController, PublicCatalogController] })
export class PublicOrdersModule {}
