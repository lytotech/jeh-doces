import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { prisma } from './client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = prisma;

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    return this.client.$connect();
  }
  onModuleDestroy() { return this.client.$disconnect(); }
}
