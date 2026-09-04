import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { EmailService } from './email.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, EmailService],
  exports: [AuthService, AuthGuard, RolesGuard, EmailService],
})
export class AuthModule {}
