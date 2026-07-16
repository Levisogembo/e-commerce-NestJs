import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/typeorm/entities/Role';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { createUserInput, editUserInput } from './dtos/createUser.input';
import { use } from 'passport';
import * as argon from 'argon2';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { Address } from 'src/typeorm/entities/Addresses';
import { AuthService } from 'src/auth/auth.service';
import { QueuesService } from 'src/queues/queues.service';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly queueService: QueuesService,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    private metricsService: MetricsService
  ) {}

  async createUser({ email, password, ...userData }: createUserInput) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail)
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await argon.hash(password);
    }

    const newUser = await this.userRepository.create({
      ...userData,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });
    const savedUser = await this.userRepository.save(newUser);
    await this.queueService.addWelcomeEmailJob({
      to: email,
      firstName: userData.firstName,
    });
    this.metricsService.incrementUserRegistration()
    await this.authService.sendEmailVerification(savedUser.userId);
    return savedUser;
  }

  async createAdmin({ email, password, ...userData }: createUserInput) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail)
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await argon.hash(password);
    }

    const newUser = await this.userRepository.create({
      ...userData,
      email,
      role: Roles.ADMIN,
      password: hashedPassword,
      createdAt: new Date(),
    });
    const savedUser = await this.userRepository.save(newUser);
    this.metricsService.incrementUserRegistration()
    await this.queueService.addWelcomeEmailJob({
      to: email,
      firstName: userData.firstName,
    });
    return savedUser;
  }

  async getOneUser(userId: string) {
    const foundUser = await this.userRepository.findOne({ where: { userId } });
    if (!foundUser) throw new NotFoundException('User not found');
    return {
      userId: foundUser.userId,
      email: foundUser.email,
      role: foundUser.role,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      createdAt: foundUser.createdAt,
      isVerified: foundUser.isVerified,
      phoneNumber: foundUser.phoneNumber,
    };
  }

  async getAllUsers(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const users = await this.userRepository.find({
      skip: offset,
      take: limit,
    });
    return users;
  }

  async editProfile(userId, profilePayload: editUserInput) {
    const foundUser = await this.userRepository.findOne({ where: { userId } });
    if (!foundUser) throw new NotFoundException();
    if (profilePayload.email) {
      const foundEmail = await this.userRepository.findOne({
        where: { email: profilePayload.email },
      });
      if (foundEmail)
        throw new ConflictException(
          'Email already exists please try another one',
        );
    }
    const filteredObj = Object.fromEntries(
      Object.entries(profilePayload).filter(
        ([_, value]) => value !== undefined && value !== null && value !== '',
      ),
    );
    
    await this.userRepository.update(userId, filteredObj);
    const user = await this.getOneUser(userId);

    return user;
  }

  async deleteUser(userId: string) {
    const result = await this.userRepository.delete({ userId });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    return 'User deleted successfully';
  }
}
