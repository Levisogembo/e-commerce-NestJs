import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from 'src/typeorm/entities/User';
import { AuthResponse, localInput } from './dtos/localLogin.input';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GqlLocalGuard } from './guards/local.guard';
import { CurrentUser } from './decorators/userToken.decorator';
import { changePasswordInput } from './dtos/changePassword.input';
import { JwtGqlGuard } from './guards/jwt.guard';
import { jwtPayloadDto } from './dtos/jwtPayload.dto';
import { AuthService } from './auth.service';
import { EmailsService } from 'src/emails/emails.service';
import { RedisService } from 'src/redis/redis.service';
import { logoutResponseInput } from './dtos/logoutResponse.input';
import { timeStamp } from 'console';
import { JwtService } from '@nestjs/jwt';

@Resolver(() => User)
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private readonly emailService: EmailsService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService
  ) { }

  @Mutation(() => AuthResponse)
  @UseGuards(GqlLocalGuard)
  @UsePipes(new ValidationPipe())
  async login(
    @CurrentUser() tokens: { accessToken: string, refreshToken: string },
    @Args('loginInput') loginInput: localInput,
  ) {
    return tokens;
  }

  @Mutation(() => String)
  @UseGuards(JwtGqlGuard)
  @UsePipes(new ValidationPipe())
  async changePassword(
    @CurrentUser() req: jwtPayloadDto,
    @Args('passwordInput')
    { newPassword, confirmedPassword, currentPassword }: changePasswordInput,
  ) { 
    if (newPassword !== confirmedPassword)
      throw new HttpException('Passwords do not match', HttpStatus.CONFLICT);
    const userId = req.userId;
    return await this.authService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  @Query(() => String)
  @UseGuards(JwtGqlGuard)
  async sendVerificationEmail(@CurrentUser() req: jwtPayloadDto) {
    const userId = req.userId;
    return await this.authService.sendEmailVerification(userId);
  }

  @Mutation(() => logoutResponseInput)
  @UseGuards(JwtGqlGuard)
  async logout(
    @Context() context,
    @Args('refreshToken', { nullable: true }) refreshToken?: string
  ) {
    const authHeader = context.req.headers.authorization
    if (!authHeader) throw new UnauthorizedException('No auth header provided')

    const extractedToken = authHeader.replace('Bearer ', '').trim()
    if (!extractedToken) throw new UnauthorizedException('No token provided')

    const decoded = this.jwtService.decode(extractedToken) as any
    const userId = decoded?.userId

    await this.redisService.invalidateToken(extractedToken)
    if (userId) {
      await this.redisService.deleteRefreshToken(userId)
    }

    return {
      success: true,
      message: 'You have logged out successfully',
      timeStamp: new Date()
    }
  }

  @Query(() => String)
  hello() {
    return 'Hello GraphQL';
  }
}
