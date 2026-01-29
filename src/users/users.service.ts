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
import { Address } from 'src/typeorm/entities/Addresses';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly emailsService: EmailsService,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
  ) { }

  async createUser({ email, password, ...userData }: createUserInput) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail) throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await argon.hash(password);
    }

    const newUser = await this.userRepository.create({
      ...userData,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });
    const savedUser = await this.userRepository.save(newUser)
    await this.emailsService.sendWelcomeMessage(email, userData.firstName)
    return savedUser
  }

  async createAdmin({ email, password, ...userData }: createUserInput) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail) throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    let hashedPassword: string | undefined;
    if (password) {
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
    await this.emailsService.sendWelcomeMessage(email, userData.firstName)
    return savedUser
  }

  async getOneUser(userId:string){
    const foundUser = await this.userRepository.findOne({where:{userId}})
    if(!foundUser) throw new NotFoundException('User not found');
    return foundUser
  }

  async getAllUsers(page:number,limit:number){
    const offset = (page - 1) * limit
    const users = await this.userRepository.find({
      skip: offset,
      take: limit
    })
    return users
  }

  async deleteUser(userId: string) {
    const result = await this.userRepository.delete({ userId });
  
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  
    return 'User deleted successfully';
  }
  
  
}
