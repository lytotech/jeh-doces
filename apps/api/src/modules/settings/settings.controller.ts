import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { validateBackupData } from '../../db';

@Controller('api')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(CompanyContextInterceptor)
export class SettingsController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get('settings') getSettings() {
    return this.database.database.getSettings();
  }
  @Roles('owner', 'admin') @Put('settings') saveSettings(@Body() body: any) {
    return this.database.database.saveSettings(body);
  }
  @Roles('owner', 'admin') @Get('backup') backup() {
    return this.database.database.getAllData();
  }
  @Roles('owner') @HttpCode(HttpStatus.OK) @Post('backup/restore') async restore(
    @Body() body: any,
  ) {
    if (!validateBackupData(body)) {
      throw new BadRequestException('Backup inválido: envie um arquivo exportado pelo Confeiti.');
    }
    return { success: await this.database.database.restoreAllData(body) };
  }
  @Roles('owner') @HttpCode(HttpStatus.OK) @Post('backup/reset') async reset() {
    await this.database.database.resetToDefault();
    return { success: true };
  }
}
