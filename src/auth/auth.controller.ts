import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google.guard';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { resetPasswordDto } from './dtos/resetPassword.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async handleLogin() {}

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleRedirect(@Req() req: Request, @Res() res: Response) {
    const userToken = req.user as unknown as {
      accessToken: string;
      refreshToken: string;
    };
    const redirectUrl = this.configService.get<string>('GOOGLE_REDIRECT_URL');
    return res.redirect(
      `${redirectUrl}=${userToken.accessToken}&refreshToken=${userToken.refreshToken}`,
    );
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return await this.authService.refreshAccessToken(body.refreshToken);
  }

  @Get('valid')
  async validUser(@Query('token') userToken: string) {
    return { msg: 'login success', userToken };
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.userId;
      return await this.authService.verifyUser(userId);
    } catch (error) {
      throw new BadRequestException(
        'Verification link expired. Request a new one.',
      );
    }
  }

  @Post('forgot')
  async forgotPassword(@Body() { email }) {
    return await this.authService.forgotPassword(email);
  }

  @Post('reset')
  @UsePipes(new ValidationPipe())
  async resetPassword(
    @Body() { newPassword, confirmedPassword, token }: resetPasswordDto,
  ) {
    const isValidToken = await this.jwtService.verifyAsync(token);
    if (!isValidToken) throw new BadRequestException('Invalid token');
    if (newPassword !== confirmedPassword)
      throw new ConflictException('Passwords do not match');
    const userId = isValidToken.userId;
    return await this.authService.resetPassword(userId, newPassword);
  }
}
