import { ParseUUIDPipe, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ROLES } from "src/auth/decorators/roles.decorator";
import { JwtGqlGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/roles/dtos/enums/roles.enum";
import { subCategory } from "src/typeorm/entities/subCategory";
import { subCategoryService } from "./subCategory.service";
import { createSubCategoryInput } from "./dtos/createSubCategory.input";
import { updateSubCategoryInput } from "./dtos/updateSubCategory.input";


@Resolver(()=>subCategory)
@ROLES(Roles.ADMIN)
@UseGuards(JwtGqlGuard,RolesGuard)
@UsePipes(new ValidationPipe)
export class subCategoryResolver {
    constructor(private subCategoryService: subCategoryService){}

    @Mutation(()=>subCategory)
    async createSubCategory (@Args("subCategoryPayload") subCategoryPayload: createSubCategoryInput) {
        return await this.subCategoryService.createSubCategory(subCategoryPayload)
    }

    @Mutation(()=>subCategory)
    async updateSubCategory(@Args("subCategoryId",ParseUUIDPipe) subCategoryId:string ,@Args("updateSubCategoryPayload") updateSubCategoryPayload: updateSubCategoryInput){
        return await this.subCategoryService.updateSubCategory(subCategoryId,updateSubCategoryPayload)
    }

    @Query(()=>subCategory)
    async getOneSubCategory(@Args("subCategoryId",ParseUUIDPipe) subCategoryId:string){
        return await this.subCategoryService.getSubCategory(subCategoryId)
    }

    @Mutation(()=>String)
    async deleteSubCategory(@Args("subCategoryId",ParseUUIDPipe) subCategoryId:string){
        return await this.subCategoryService.deleteSubCategory(subCategoryId)
    }
}