import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { AuthContext } from '../../common/auth.types';
import { BillingService } from './billing.service';

@Controller('api/billing')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}

  @Get('webhook') @HttpCode(HttpStatus.OK) webhookGet() { return { ok: true }; }

  @Post('webhook') @HttpCode(HttpStatus.OK) async webhook(@Body() body: any) {
    const paymentId = body?.data?.id || (body?.type === 'payment' ? body?.id : null);
    await this.billing.processWebhook(String(paymentId || ''));
    return { received: true };
  }

  @UseGuards(AuthGuard) @UseInterceptors(CompanyContextInterceptor)
  @Get() status(@CurrentUser() auth: AuthContext) { return this.billing.getStatus(auth.companyId); }

  @UseGuards(AuthGuard) @UseInterceptors(CompanyContextInterceptor)
  @Post('pix') createPix(@CurrentUser() auth: AuthContext, @Body('plan') plan: string) {
    return this.billing.createPixPayment(auth, plan);
  }
}
