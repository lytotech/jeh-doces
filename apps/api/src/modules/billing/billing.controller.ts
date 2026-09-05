import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Inject, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { AuthContext } from '../../common/auth.types';
import { BillingService } from './billing.service';
import { env } from '../../config/env';

@Controller('api/billing')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}

  @Get('webhook') @HttpCode(HttpStatus.OK) webhookGet() { return { ok: true }; }

  @Post('webhook') @HttpCode(HttpStatus.OK) async webhook(@Body() body: any, @Headers('x-signature') signature?: string, @Headers('x-request-id') requestId?: string, @Query('data.id') queryDataId?: string) {
    const paymentId = body?.data?.id || (body?.type === 'payment' ? body?.id : null);
    const dataId = String(queryDataId || paymentId || '');
    if (env.mercadoPagoWebhookSecret && !this.billing.validateWebhookSignature(signature, requestId, dataId)) {
      throw new BadRequestException('Assinatura do webhook inválida.');
    }
    await this.billing.processWebhook(String(paymentId || ''));
    return { received: true };
  }

  @UseGuards(AuthGuard) @UseInterceptors(CompanyContextInterceptor)
  @Get() status(@CurrentUser() auth: AuthContext) { return this.billing.getStatus(auth.companyId); }

  @UseGuards(AuthGuard) @UseInterceptors(CompanyContextInterceptor)
  @Post('pix') createPix(@CurrentUser() auth: AuthContext, @Body('plan') plan: string) {
    return this.billing.createPixPayment(auth, plan);
  }

  @Delete('subscription') cancel(@CurrentUser() auth: AuthContext) {
    return this.billing.cancelRenewal(auth.companyId);
  }
}
