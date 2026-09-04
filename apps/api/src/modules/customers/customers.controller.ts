import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, NotFoundException, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api')
@UseGuards(AuthGuard)
@UseInterceptors(CompanyContextInterceptor)
export class CustomersController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get('customers') get(@Query('archived') archived?: string, @Query('search') search?: string) { return this.database.database.getCustomers(archived === 'true', search || ''); }
  @Post('customers') save(@Body() body: any) { return this.database.database.saveCustomer(body); }
  @Put('customers/:id') update(@Param('id') id: string, @Body() body: any) { return this.database.database.saveCustomer({ ...body, id }); }
  @Patch('customers/:id/archive') async archive(@Param('id') id: string, @Body('archived') archived: boolean) { const updated = await this.database.database.archiveCustomer(id, archived !== false); if (!updated) throw new NotFoundException('Cliente não encontrado'); return updated; }
  @Get('commitments') commitments() { return this.database.database.getCommitments(); }
  @Post('commitments') saveCommitment(@Body() body: any) { return this.database.database.saveCommitment(body); }
  @Put('commitments/:id') updateCommitment(@Param('id') id: string, @Body() body: any) { return this.database.database.saveCommitment({ ...body, id }); }
  @Delete('commitments/:id') deleteCommitment(@Param('id') id: string) { return this.database.database.deleteCommitment(id).then(success => ({ success })); }
}
