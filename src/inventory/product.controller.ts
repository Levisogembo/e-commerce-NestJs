import { Body, Controller, Logger, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from "@nestjs/common";
import { productService } from "./product.service";
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from "multer";
import * as fs from 'fs'
import { ROLES } from "src/auth/decorators/roles.decorator";
import { Roles } from "src/roles/dtos/enums/roles.enum";
import { createProductDto, imageInput, updateImage } from "./dtos/createProduct.input";
import { updateProductDto } from "./dtos/updateProduct.input";

@Controller('product')
@UsePipes(new ValidationPipe())
export class ProductController {
    private logger = new Logger(ProductController.name)
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

    @Patch('update/:productId')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './images',
            filename: (req, file, callback) => {
                const uniqueName = `${Date.now()}-${file.originalname}`
                callback(null, uniqueName)
            }
        })
    }))
    async updateProduct(@Param('productId', ParseUUIDPipe) productId: string, @UploadedFile() file: Express.Multer.File,
        @Body() updatePayload: updateProductDto) {
        //console.log(updatePayload);
        
        let fileMetadata: updateImage = {}
        if (file) {
            this.logger.log(`New image uploading replacing the old image`)
            try {
                const foundProduct = await this.productService.getProductDetails(productId)
                const filePath = foundProduct.images[0].filepath
                if (filePath) {
                    //remove old image
                    await fs.promises.unlink(filePath).catch(() => {
                        this.logger.warn(`Old file not found on disk: ${filePath}`);
                    })
                }
            } catch (error) {
                this.logger.error(`Error occured deleting image ${error.message}`)
                throw error
            }
            fileMetadata = {
                originalName: file.originalname || file.filename,
                fileName: file.filename,
                mimeType: file.mimetype,
                fileSize: file.size,
                filePath: file.path,
            }
        }
        try {
            return await this.productService.updateProduct(productId,updatePayload, fileMetadata)
        } catch (error) {
            if (file) await fs.promises.unlink(file.path).catch(() => {
                this.logger.log('error unlinking file');
            });
            throw error
        }
    }
}