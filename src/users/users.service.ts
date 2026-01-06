import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/typeorm/entities/Role';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { createUserInput } from './dtos/createUser.input';
import { use } from 'passport';
import * as argon from 'argon2'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private rolesRepository: Repository<Role>,
  ) {}

  async createUser({ role, email, password, ...userData }: createUserInput) {
    const foundRole = await this.rolesRepository.findOne({ where: { roleId: role }});
    if (!foundRole) throw new NotFoundException();
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail) throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    let hashedPassword: string | undefined;
    if(password) {
      hashedPassword = await argon.hash(password);
    }
     
    const newUser = await this.userRepository.create({
        ...userData,
        email,
        password: hashedPassword,
        role: [foundRole],
        createdAt: new Date()
    });
    return await this.userRepository.save(newUser)
  }
}
