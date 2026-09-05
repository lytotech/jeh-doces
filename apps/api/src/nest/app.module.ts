import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AuthModule } from '../modules/auth/auth.module';
import { HealthModule } from '../modules/health/health.module';
import { PublicOrdersModule } from '../modules/public-orders/public-orders.module';
import { CatalogModule } from '../modules/catalog/catalog.module';
import { OrdersModule } from '../modules/orders/orders.module';
import { CustomersModule } from '../modules/customers/customers.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { BillingModule } from '../modules/billing/billing.module';
import { AccountModule } from '../modules/account/account.module';

/** Root module. Feature modules are migrated here incrementally. */
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    HealthModule,
    PublicOrdersModule,
    CatalogModule,
    OrdersModule,
    CustomersModule,
    SettingsModule,
    BillingModule,
    AccountModule,
  ],
})
export class AppModule {}
