import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { createGoogleUser } from './dtos/createGoogleUser.input';
import { EmailsService } from 'src/emails/emails.service';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { QueuesService } from 'src/queues/queues.service';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailsService: EmailsService,
    private redisService: RedisService,
    private configService: ConfigService,
    private queueService: QueuesService,
    private metricsService: MetricsService,
  ) {}

  async validateLocal(email: string, password: string) {
    const foundUser = await this.userRepository.findOne({
      where: { email },
    });
    if (!foundUser) {
      this.metricsService.incrementFailedLogin();
      throw new NotFoundException("Credentials do not match");
    }
    if (!foundUser.password) {
      this.metricsService.incrementFailedLogin();
      throw new BadRequestException(
        'You do not have any password, please login using google',
      );
    }
    const userPassword = foundUser.password as string;
    const passwordMatch = await argon.verify(userPassword, password);
    if (!passwordMatch) {
      this.metricsService.incrementFailedLogin();
      throw new HttpException(
        'Credentials do not match',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!foundUser.isVerified) {
      this.metricsService.incrementFailedLogin();
      throw new HttpException(
        'Email not verified please verify your email',
        HttpStatus.UNAUTHORIZED,
      );
    }
    this.metricsService.incrementSuccessfulLogin();
    return await this.generateTokenPair(foundUser);
  }

  async validateGoogle(email, profile: createGoogleUser) {
    const foundUser = await this.userRepository.findOne({ where: { email } });
    if (!foundUser) {
      return await this.createGoogleUser(email, profile);
    }
    if (!foundUser.isVerified) {
      this.metricsService.incrementFailedLogin();
      throw new HttpException(
        'Email not verified please verify your email',
        HttpStatus.UNAUTHORIZED,
      );
    }
    this.metricsService.incrementSuccessfulLogin();
    return await this.generateTokenPair(foundUser);
  }

  async generateTokenPair(
    user,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: this.configService.get('JWT_SECRET'),
    });

    const refreshToken = await this.jwtService.signAsync(
      { userId: user.userId },
      {
        expiresIn: '30d',
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      },
    );

    const ttl = 60 * 60; // 1 hour

    // store both in Redis
    await this.redisService.storeToken(accessToken, user.userId, ttl);
    await this.redisService.storeRefreshToken(refreshToken, user.userId);

    this.logger.log(`Token pair generated for user: ${user.userId}`);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const userId = decoded.userId;

      const isValid = await this.redisService.validateRefreshToken(
        refreshToken,
        userId,
      );
      if (!isValid) {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      }

      const user = await this.userRepository.findOne({ where: { userId } });
      if (!user) throw new UnauthorizedException('User not found');

      // generate new access token
      const newAccessToken = await this.jwtService.signAsync(
        {
          userId: user.userId,
          email: user.email,
          role: user.role,
        },
        {
          expiresIn: '1h',
          secret: this.configService.get('JWT_SECRET'),
        },
      );

      // store new access token in Redis — replaces old one
      await this.redisService.storeToken(newAccessToken, userId, 60 * 60);

      this.logger.log(`Access token refreshed for user: ${userId}`);

      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async createGoogleUser(email: string, profile: createGoogleUser) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }

    const googleUser = await this.userRepository.create({
      firstName: profile.given_name,
      lastName: profile.family_name,
      email,
      isVerified: true,
      createdAt: new Date(),
    });
    const savedUser = await this.userRepository.save(googleUser);
    await this.queueService.addWelcomeEmailJob({
      to: email,
      firstName: profile.given_name,
    });
    this.metricsService.incrementUserRegistration();
    this.metricsService.incrementSuccessfulLogin();
    return await this.generateTokenPair(savedUser);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) throw new NotFoundException();
    const password = user?.password;
    if (password) {
      const match = await argon.verify(password, currentPassword);
      if (!match)
        throw new HttpException(
          'Old password does not match',
          HttpStatus.CONFLICT,
        );
      const hashedPassword = await argon.hash(newPassword);
      const updateObj = { password: hashedPassword };
      await this.userRepository.update(userId, updateObj);
      return 'Password Changed Successfully';
    } else {
      throw new BadRequestException(
        'You do not have any password set at the moment',
      );
    }
  }

  async sendEmailVerification(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) throw new NotFoundException();
    const email = user?.email;
    const payload = { email, userId };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: this.configService.get('JWT_SECRET'),
    });
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify?token=${token}`;
    await this.queueService.addVerificationEmailJob({
      to: email,
      verificationUrl,
      firstName: user.firstName,
    });
    return `Verification email queued for ${email}`;
  }

  async resendVerification(email: string) {
    const foundUser = await this.userRepository.findOne({ where: { email } });
    if (!foundUser) throw new NotFoundException();
    const userId = foundUser.userId;
    return await this.sendEmailVerification(userId);
  }

  async verifyUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) throw new NotFoundException();
    await this.userRepository.update(userId, { isVerified: true });
    return `Email verified successfully`;
  }

  async forgotPassword(email: string) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (!foundEmail) throw new NotFoundException();
    //send password reset email
    const payload = { email, userId: foundEmail.userId };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: this.configService.get('JWT_SECRET'),
    });
    const resetUrl = `${this.configService.get<string>('FRONTEND_RESET_URL')}?token=${token}`;
    const res = await this.emailsService.sendPasswordReset(
      email,
      resetUrl,
      foundEmail.firstName,
    );
    if (res.status !== 'success')
      throw new HttpException(
        'Could not send password reset email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return { msg: `Password reset email sent successfully` };
  }

  async resetPassword(userId: string, newPassword: string) {
    const findUser = await this.userRepository.findOne({ where: { userId } });
    if (!findUser) throw new NotFoundException();
    const hashedPassword = await argon.hash(newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });
    return { msg: 'Password reset successfully' };
  }
}
