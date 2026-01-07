import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { LocalStrategy } from './strategies/localStrategy';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/googleStrategy';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async(configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {expiresIn: configService.get<number>("JWT_EXPIRES_IN")}
      })
    })
  ],
  providers: [AuthResolver, AuthService, LocalStrategy, GoogleStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
