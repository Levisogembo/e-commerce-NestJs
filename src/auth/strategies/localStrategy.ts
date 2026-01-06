import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
        usernameField: 'email'
    });
  }

  async validate(email:string, password:string) {
    console.log('inside local strategy');
    const user = await this.authService.validateLocal(email,password)
    if(!user) throw new NotFoundException()
    return user
  }
}
