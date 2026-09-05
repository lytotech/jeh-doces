import { Controller, Delete, Get, Inject, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthContext } from '../../common/auth.types';
import { AccountService } from './account.service';
import { Roles } from '../auth/roles.decorator';

@Controller('api/account')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(CompanyContextInterceptor)
export class AccountController {
  constructor(@Inject(AccountService) private readonly account: AccountService) {}
  @Get('deletion') status(@CurrentUser() auth: AuthContext) { return this.account.status(auth.companyId); }
  @Roles('owner') @Post('deletion') request(@CurrentUser() auth: AuthContext) { return this.account.requestDeletion(auth.companyId); }
  @Roles('owner') @Delete('deletion') cancel(@CurrentUser() auth: AuthContext) { return this.account.cancelDeletion(auth.companyId); }
}
