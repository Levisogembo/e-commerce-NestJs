import { Logger, ParseIntPipe, ParseUUIDPipe, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from "@nestjs/common";
import { Args, Mutation, Resolver, Query } from "@nestjs/graphql";
import { ROLES } from "src/auth/decorators/roles.decorator";
import { Roles } from "src/roles/dtos/enums/roles.enum";
import { Product } from "src/typeorm/entities/Product";
import { productService } from "./product.service";
import { JwtGqlGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { createProductInput, imageInput, PaginatedProducts } from "./dtos/createProduct.input";
//import { updateProductInput } from "./dtos/updateProduct.input";
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from "multer";
import * as fs from 'fs'


@Resolver(() => Product)
@UsePipes(new ValidationPipe)
export class productResolver {
    private logger = new Logger(productResolver.name)
    constructor(private productService: productService) { }

    @Mutation(() => Product)
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtGqlGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './images',
            filename: (req, file, callback) => {
                const uniqueName = `${Date.now()}-${file.originalname}`
                callback(null, uniqueName)
            }
        })
    }))
    async createProduct(@UploadedFile() file: Express.Multer.File, @Args("productPayload") productPayload: createProductInput) {
        console.log(productPayload);
        
        const fileName = file.filename
        const fileMetadata: imageInput = {
            originalName: file.originalname || file.filename,
            fileName,
            mimeType: file.mimetype,
            fileSize: file.size,
            filePath: file.path,
        }
        try {
            return await this.productService.createNewProduct(productPayload, fileMetadata)
        } catch (error) {
            //incase there is an error saving file remove the saved image
            await fs.promises.unlink(file.path).catch(() => { })
            throw error
        }
    }

    @Query(() => Product)
    async getOneProduct(@Args("productId", ParseUUIDPipe) productId: string) {
        return await this.productService.getProductDetails(productId)
    }

    @Query(() => PaginatedProducts)
    async getManyProducts(@Args("page", ParseIntPipe) page: number, @Args("limit", ParseIntPipe) limit: number) {
        return await this.productService.getProducts(page, limit)
    }

    @Mutation(() => String)
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtGqlGuard, RolesGuard)
    async deleteProduct(@Args("productId", ParseUUIDPipe) productId: string) {
        return this.productService.deleteProduct(productId)
    }

    // @Mutation(() => Product)
    // @ROLES(Roles.ADMIN)
    // @UseGuards(JwtGqlGuard, RolesGuard)
    // async updateProduct(@Args("productId", ParseUUIDPipe) productId: string, @Args("updatePayload") updatePayload: updateProductInput) {
    //     return await this.productService.updateProduct(productId, updatePayload)
    // }
}