import {
  HttpException,
  HttpStatus,
  Injectable,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService, private emailsService: EmailsService
  ) {}

  async validateLocal(email: string, password: string) {
    const foundUser = await this.userRepository.findOne({
      where: { email },
    });
    if (!foundUser) throw new NotFoundException();
    const userPassword = foundUser.password as string;
    const passwordMatch = await argon.verify(userPassword, password);
    if (!passwordMatch)
      throw new HttpException(
        'Credentials do not match',
        HttpStatus.UNAUTHORIZED,
      );
    const payload = { userId: foundUser.userId, email, role: foundUser.role };
    return await this.generateJwtToken(payload);
  }

  async validateGoogle(email, profile: createGoogleUser) {
    const foundUser = await this.userRepository.findOne({ where: { email } });
    if (!foundUser) {
      return await this.createGoogleUser(email, profile);
    }
    const payload = { userId: foundUser.userId, email, role: foundUser.role };
    return await this.generateJwtToken(payload);
  }

  async generateJwtToken(payload) {
    const jwtToken = await this.jwtService.signAsync(payload);
    return jwtToken;
  }

  async createGoogleUser(email: string, profile: createGoogleUser) {
    const foundEmail = await this.userRepository.findOne({ where: { email } });
    if (foundEmail)
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);

    const googleUser = await this.userRepository.create({
      firstName: profile.given_name,
      lastName: profile.family_name,
      email,
      isVerified: true,
      createdAt: new Date(),
    });
    const savedUser = await this.userRepository.save(googleUser);
    const payload = { userId: savedUser.userId, email, role: savedUser.role };
    //send welcome email to user
    await this.emailsService.sendWelcomeMessage(email,profile.given_name)
    return await this.generateJwtToken(payload);
  }

  async changePassword(userId:string, currentPassword:string, newPassword:string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) throw new NotFoundException();
    const password = user?.password;
    if (password) {
      const match = await argon.verify(password, currentPassword);
      if (!match)
        throw new HttpException(
          'Current password does not match',
          HttpStatus.CONFLICT,
        );
      const hashedPassword = await argon.hash(newPassword);
      const updateObj = { password: hashedPassword };
      await this.userRepository.update(userId, updateObj);
      return 'Password Changed Successfully'
    }
  }

  async sendEmailVerification(userId:string){
    const user = await this.userRepository.findOne({where:{userId}})
    if(!user) throw new NotFoundException()
    const email = user?.email
    const payload = {email,userId}
    const token = await this.generateJwtToken(payload)
    const verificationUrl = `http://localhost:3000/api/v1/auth/verify?token=${token}`
    const res = await this.emailsService.sendVerificationEmail(email,verificationUrl,user.firstName)
    if(res.status !== 'success') throw new HttpException('could not send verification email',HttpStatus.INTERNAL_SERVER_ERROR)
    return `Verification email sent to ${email}`
  }

  async verifyUser(userId: string){
    const user = await this.userRepository.findOne({where:{userId}})
    if(!user) throw new NotFoundException()
    await this.userRepository.update(userId,{isVerified:true})
    return `Email verified successfully`
  }

  async forgotPassword(email:string){
    const foundEmail = await this.userRepository.findOne({where:{email}})
    if(!foundEmail) throw new NotFoundException()
    //send password reset email
    const payload = {email,userId: foundEmail.userId}
    const token = await this.generateJwtToken(payload)
    const resetUrl = `http://localhost:3000/api/v1/auth/reset?token=${token}`
    const res = await this.emailsService.sendPasswordReset(email,resetUrl,foundEmail.firstName)
    if(res.status !== 'success') throw new HttpException('Could not send password reset email',HttpStatus.INTERNAL_SERVER_ERROR)
    return {msg:`Password reset email sent successfully`}
  }

  async resetPassword(userId:string,newPassword:string){
      const findUser = await this.userRepository.findOne({where:{userId}})
      if(!findUser) throw new NotFoundException()
      const hashedPassword = await argon.hash(newPassword)
      await this.userRepository.update(userId,{password:hashedPassword})
      return {msg:'Password reset successfully'}
  }
}
