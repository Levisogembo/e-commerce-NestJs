import { ParseUUIDPipe, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { Category } from 'src/typeorm/entities/Categories';
import { createCategoryInput } from './dtos/createCategory.input';
import { InventoryService } from './inventory.service';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { JwtGqlGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { updateCategoryInput } from './dtos/updateCategory.input';

@Resolver(() => Category)
@ROLES(Roles.ADMIN)
@UseGuards(JwtGqlGuard, RolesGuard)
@UsePipes(new ValidationPipe)
export class InventoryResolver {
    constructor(private inventoryService: InventoryService) { }

    @Mutation(() => Category)
    async createCategory(@Args("categoryInput") categoryInput: createCategoryInput) {
        return await this.inventoryService.createNewCategory(categoryInput)
    }

    @Mutation(() => Category)
    async updateCategory(@Args("categoryId",ParseUUIDPipe) categoryId: string, @Args("updateCategoryInput") updateCategoryInput: updateCategoryInput) {
       return await this.inventoryService.updateCategory(categoryId,updateCategoryInput)
    }
}
