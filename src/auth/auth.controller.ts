import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/googleGuard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async handleLogin() {}

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleRedirect(@Req() req:Request, @Res() res: Response) {
    const userToken = req.user
    return res.redirect(`http://localhost:3000/api/v1/auth/valid?token=${userToken}`)
  }

  @Get('valid')
  async validUser(@Query('token') userToken:string){
    return {msg: 'login success',userToken}
  }
}
