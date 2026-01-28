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
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { EmailsService } from 'src/emails/emails.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly emailsService: EmailsService
  ) {}

  async createUser({email, password, ...userData }: createUserInput) {
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
        createdAt: new Date()
    });
    const savedUser = await this.userRepository.save(newUser)
    await this.emailsService.sendWelcomeMessage(email,userData.firstName)
    return savedUser
  }

  async createAdmin({email, password, ...userData }: createUserInput) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail) throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    let hashedPassword: string | undefined;
    if(password) {
      hashedPassword = await argon.hash(password);
    }
     
    const newUser = await this.userRepository.create({
        ...userData,
        email,
        role: Roles.ADMIN,
        password: hashedPassword,
        createdAt: new Date()
    });
    const savedUser = await this.userRepository.save(newUser)
    await this.emailsService.sendWelcomeMessage(email,userData.firstName)
    return savedUser
  }

  async deleteUser(userId: string){
    const user = await this.userRepository.findOne({
      where:{userId},
      relations: ['address']
    })
    if(!user) throw new NotFoundException()
    await this.userRepository.remove(user)
    return "User Deleted successfully"
  }
}
