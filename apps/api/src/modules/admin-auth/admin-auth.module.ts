import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAuthGuard],
})
export class AdminAuthModule {}
