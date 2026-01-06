import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from 'src/typeorm/entities/User';
import { createUserInput } from './dtos/createUser.input';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@Resolver(()=>User)
export class UsersResolver {
    constructor(private userService: UsersService){}

    @Mutation(()=>User)
    @UsePipes(new ValidationPipe)
    async createUser(@Args('userInput') userInput: createUserInput){
        return await this.userService.createUser(userInput)
    }
}
