import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { AuthContext, AuthenticatedRequest } from '../../common/auth.types';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly service: AuthService) {}

  @Post('register') register(@Body() body: Record<string, unknown>) { return this.service.register(body); }
  @HttpCode(HttpStatus.OK) @Post('login') login(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply) { return this.service.login(body, reply); }
  @HttpCode(HttpStatus.OK) @Post('verify-email') verify(@Body('token') token: string, @Res({ passthrough: true }) reply: FastifyReply) { return this.service.verifyEmail(token, reply); }
  @HttpCode(HttpStatus.OK) @Post('resend-verification') resend(@Body('email') email: string) { return this.service.resendVerification(email); }
  @HttpCode(HttpStatus.OK) @Post('forgot-password') forgot(@Body('email') email: string) { return this.service.forgotPassword(email); }
  @HttpCode(HttpStatus.OK) @Post('reset-password') reset(@Body() body: Record<string, unknown>) { return this.service.resetPassword(body.token, String(body.password ?? '')); }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK) @Post('logout') logout(@CurrentUser() auth: AuthContext, @Res({ passthrough: true }) reply: FastifyReply) { return this.service.logout(auth, reply); }
  @UseGuards(AuthGuard)
  @Get('me') me(@CurrentUser() auth: AuthContext) { return this.service.me(auth); }
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK) @Post('switch-company') switchCompany(@CurrentUser() auth: AuthContext, @Body('companyId') companyId: string) { return this.service.switchCompany(auth, companyId); }
  @UseGuards(AuthGuard)
  @Get('members') members(@CurrentUser() auth: AuthContext) { return this.service.members(auth); }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Post('invitations') invite(@CurrentUser() auth: AuthContext, @Body() body: Record<string, unknown>) { return this.service.invite(auth, body); }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('owner')
  @Patch('members/:id') change(@CurrentUser() auth: AuthContext, @Param('id') id: string, @Body('role') role: string) { return this.service.changeMember(auth, id, role); }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Delete('members/:id') remove(@CurrentUser() auth: AuthContext, @Param('id') id: string) { return this.service.removeMember(auth, id); }
}
