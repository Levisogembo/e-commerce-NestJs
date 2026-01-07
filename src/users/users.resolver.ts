import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from 'src/typeorm/entities/User';
import { createUserInput } from './dtos/createUser.input';
import { HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';

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
    @UsePipes(new ValidationPipe)
    async createAdmin(@Args('adminInput') adminInput: createUserInput){
        const pass = adminInput.password
        const confirmPass = adminInput.confirmPassword
        if(pass !== confirmPass) throw new HttpException('Passwords do not match',HttpStatus.CONFLICT)
        return await this.userService.createAdmin(adminInput)
    }
}
