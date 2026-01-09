import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtPayloadDto } from '../dtos/jwtPayload.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService,private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'fallback',
      passReqToCallback: true
    });
  }

  async validate(req,payload: jwtPayloadDto) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    if(!token) throw new UnauthorizedException('token is missing')
    
    //validate token in redis
    const redisValidate = await this.redisService.validateToken(token)
    if(!redisValidate) throw new UnauthorizedException('Invalid or expired token')
    
    return payload;
  }
}
