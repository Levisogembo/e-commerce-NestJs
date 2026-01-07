import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { Injectable } from '@nestjs/common';
import { createGoogleUser } from '../dtos/createGoogleUser.input';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('CLIENT_ID') || 'client',
      clientSecret: configService.get<string>('CLIENT_SECRET') ?? '',
      scope: ['profile', 'email'],
      callbackURL: 'http://localhost:3000/api/v1/auth/google/redirect',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const email = profile._json.email as string;
    const given_name = profile._json.given_name as string;
    const family_name = profile._json.family_name as string;
    const payload: createGoogleUser = {given_name,family_name}
    const user = await this.authService.validateGoogle(email,payload);
    return user;
    //    return profile
  }
}
