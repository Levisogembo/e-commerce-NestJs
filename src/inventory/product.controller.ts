import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from "@nestjs/common";
import { productService } from "./product.service";
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from "multer";
import * as fs from 'fs'
import { ROLES } from "src/auth/decorators/roles.decorator";
import { Roles } from "src/roles/dtos/enums/roles.enum";
import { createProductDto, imageInput } from "./dtos/createProduct.input";

@Controller('product')
@UsePipes(new ValidationPipe())
export class ProductController {
    constructor(private productService: productService) { }

    @Post('create')
    @ROLES(Roles.ADMIN)
    @UseGuards()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './images',
            filename: (req, file, callback) => {
                const uniqueName = `${Date.now()}-${file.originalname}`
                callback(null, uniqueName)
            }
        })
    }))
    async createProduct(@UploadedFile() file: Express.Multer.File, @Body() productPayload: createProductDto) {
        //console.log(productPayload);
        
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
}