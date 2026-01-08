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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google.guard';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { resetPasswordDto } from './dtos/resetPassword.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async handleLogin() {}

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleRedirect(@Req() req: Request, @Res() res: Response) {
    const userToken = req.user;
    return res.redirect(
      `http://localhost:3000/api/v1/auth/valid?token=${userToken}`,
    );
  }

  @Get('valid')
  async validUser(@Query('token') userToken: string) {
    return { msg: 'login success', userToken };
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    const isValidToken = await this.jwtService.verifyAsync(token);
    if (!isValidToken) throw new BadRequestException('Invalid token');
    const userId = isValidToken.userId;
    return await this.authService.verifyUser(userId);
  }

  @Post('forgot')
  async forgotPassword(@Body() { email }) {
    return await this.authService.forgotPassword(email);
  }

  @Post('reset')
  @UsePipes(new ValidationPipe())
  async resetPassword(
    @Query('token') token: string,
    @Body() { newPassword, confirmedPassword }: resetPasswordDto,
  ) {
    const isValidToken = await this.jwtService.verifyAsync(token);
    if (!isValidToken) throw new BadRequestException('Invalid token');
    if (newPassword !== confirmedPassword) throw new ConflictException('Passwords do not match');
    const userId = isValidToken.userId;
    return await this.authService.resetPassword(userId, newPassword);
  }
}
