import { ParseIntPipe, ParseUUIDPipe, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Args, Mutation, Resolver, Query } from "@nestjs/graphql";
import { ROLES } from "src/auth/decorators/roles.decorator";
import { Roles } from "src/roles/dtos/enums/roles.enum";
import { Product } from "src/typeorm/entities/Product";
import { productService } from "./product.service";
import { JwtGqlGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { createProductInput } from "./dtos/createProduct.input";
import { updateProductInput } from "./dtos/updateProduct.input";


@Resolver(()=>Product)
@UsePipes(new ValidationPipe)
export class productResolver {
    constructor(private productService: productService){}

    @Mutation(()=>Product)
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtGqlGuard,RolesGuard)
    async createProduct(@Args("productPayload") productPayload: createProductInput){
        return await this.productService.createNewProduct(productPayload)
    }

    @Query(()=>Product)
    async getOneProduct(@Args("productId",ParseUUIDPipe) productId: string){
        return await this.productService.getProductDetails(productId)
    }

    @Query(()=>[Product])
    async getManyProducts(@Args("page",ParseIntPipe) page: number, @Args("limt",ParseIntPipe) limit: number){
        return await this.productService.getProducts(page,limit)
    }

    @Mutation(()=>String)
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtGqlGuard,RolesGuard)
    async deleteProduct(@Args("productId",ParseUUIDPipe) productId: string){
        return this.productService.deleteProduct(productId)
    }

    @Mutation(()=>Product)
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtGqlGuard,RolesGuard)
    async updateProduct(@Args("productId",ParseUUIDPipe) productId: string, @Args("updatePayload") updatePayload: updateProductInput ){
        return await this.productService.updateProduct(productId,updatePayload)
    }
}