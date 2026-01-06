import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import * as argon from 'argon2'
import { log } from 'node:console';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService){}

    async validateLocal(email,password){
        const foundUser = await this.userRepository.findOne({
            where:{email},
            relations: ['role']
        })
        if(!foundUser) throw new NotFoundException()
        const userPassword = foundUser.password as string
        const passwordMatch = await argon.verify(userPassword,password)
        if(!passwordMatch) throw new HttpException('Credentials do not match',HttpStatus.UNAUTHORIZED)
        const roles = foundUser.role.map((item)=>item.name)
        const payload = {userId: foundUser.userId, email, roles}
        return await this.generateJwtToken(payload)
    }

    async generateJwtToken(payload){
        const jwtToken = await this.jwtService.signAsync(payload)
        return jwtToken
    }
}
