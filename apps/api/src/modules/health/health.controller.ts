import { Controller, Get, Inject } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Controller('api')
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get('health') async health() {
    await this.database.database.ping();
    return { status: 'ok', database: 'ok', time: new Date().toISOString() };
  }
}
