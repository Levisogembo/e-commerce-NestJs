import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { Role } from 'src/typeorm/entities/Role';
import { createRoleInput } from './dtos/createRole.input';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@Resolver()
export class RolesResolver {
    constructor(private rolesService: RolesService){}

    @Mutation(()=>Role)
    @UsePipes(new ValidationPipe)
    async createNewRole(@Args('roleInput') roleInput: createRoleInput){
        const role = await this.rolesService.createRole(roleInput)
        return role
    }
}
