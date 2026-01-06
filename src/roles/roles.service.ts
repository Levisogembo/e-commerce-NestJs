import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/typeorm/entities/Role';
import { Repository } from 'typeorm';
import { createRoleInput } from './dtos/createRole.input';

@Injectable()
export class RolesService {
    constructor(@InjectRepository(Role) private roleRepository: Repository<Role>){}

    async createRole(roleInput: createRoleInput){
        const role = await this.roleRepository.create(roleInput)
        return await this.roleRepository.save(role)
    }
}
