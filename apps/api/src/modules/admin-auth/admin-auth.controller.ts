import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';

@Controller('api/admin-auth')
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Post('login') @HttpCode(HttpStatus.OK)
  login(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply) { return this.service.login(body, reply); }

  @UseGuards(AdminAuthGuard) @Get('me')
  me(request: FastifyRequest & { adminAuth?: any }) { return this.service.me(request.adminAuth); }

  @UseGuards(AdminAuthGuard) @Post('logout') @HttpCode(HttpStatus.OK)
  logout(request: FastifyRequest & { adminAuth?: any }, @Res({ passthrough: true }) reply: FastifyReply) { return this.service.logout(request.adminAuth, reply); }

  @UseGuards(AdminAuthGuard) @Get('users') users() { return this.service.users(); }
  @UseGuards(AdminAuthGuard) @Post('users') createUser(@Body() body: Record<string, unknown>) { return this.service.createUser(body); }
  @UseGuards(AdminAuthGuard) @Patch('users/:id/status') toggle(@Param('id') id: string, @Body('active') active: boolean) { return this.service.toggleUser(id, active); }
}
