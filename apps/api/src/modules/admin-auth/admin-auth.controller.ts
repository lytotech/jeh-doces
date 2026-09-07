import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';

@Controller('api/admin-auth')
export class AdminAuthController {
  constructor(@Inject(AdminAuthService) private readonly service: AdminAuthService) {}

  @Post('login') @HttpCode(HttpStatus.OK)
  login(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply) { return this.service.login(body, reply); }

  @UseGuards(AdminAuthGuard) @Get('me')
  me(@Req() request: FastifyRequest & { adminAuth?: any }) { return this.service.me(request.adminAuth); }

  @UseGuards(AdminAuthGuard) @Post('logout') @HttpCode(HttpStatus.OK)
  logout(@Req() request: FastifyRequest & { adminAuth?: any }, @Res({ passthrough: true }) reply: FastifyReply) { return this.service.logout(request.adminAuth, reply); }

  @UseGuards(AdminAuthGuard) @Get('users') users() { return this.service.users(); }
  @UseGuards(AdminAuthGuard) @Get('dashboard') dashboard() { return this.service.dashboard(); }
  @UseGuards(AdminAuthGuard) @Post('users') createUser(@Body() body: Record<string, unknown>) { return this.service.createUser(body); }
  @UseGuards(AdminAuthGuard) @Patch('users/:id/status') toggle(@Param('id') id: string, @Body('active') active: boolean) { return this.service.toggleUser(id, active); }
}
