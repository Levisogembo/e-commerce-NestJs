import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from 'src/typeorm/entities/User';
import { createUserInput } from './dtos/createUser.input';
import { HttpException, HttpStatus, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtGqlGuard } from 'src/auth/guards/jwt.guard';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/userToken.decorator';
import { jwtPayloadDto } from 'src/auth/dtos/jwtPayload.dto';

@Resolver(()=>User)
export class UsersResolver {
    constructor(private userService: UsersService){}

    @Mutation(()=>User)
    @UsePipes(new ValidationPipe)
    async createUser(@Args('userInput') userInput: createUserInput){
        const pass = userInput.password
        const confirmPass = userInput.confirmPassword
        if(pass !== confirmPass) throw new HttpException('Passwords do not match',HttpStatus.CONFLICT)
        return await this.userService.createUser(userInput)
    }

    @Mutation(()=>User)
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtGqlGuard,RolesGuard)
    @UsePipes(new ValidationPipe)
    async createAdmin(@Args('adminInput') adminInput: createUserInput){
        const pass = adminInput.password
        const confirmPass = adminInput.confirmPassword
        if(pass !== confirmPass) throw new HttpException('Passwords do not match',HttpStatus.CONFLICT)
        return await this.userService.createAdmin(adminInput)
    }

    @UseGuards(JwtGqlGuard)
    @Mutation(()=>String)
    async deleteUser(@CurrentUser() userToken: jwtPayloadDto){
        return await this.userService.deleteUser(userToken.userId)
    }
}
