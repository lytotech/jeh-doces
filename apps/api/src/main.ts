import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { app as expressApp } from './app';
import { env } from './config/env';
import { AppModule } from './nest/app.module';

export async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    bodyParser: false,
  });
  await nestApp.listen(env.port, env.host);
  console.log(`\n🧁 CONFEITI • API NestJS rodando na porta ${env.port}`);
  console.log(`🏠 Local: http://localhost:${env.port}`);
  return nestApp;
}
