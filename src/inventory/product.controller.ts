import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { productService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import * as fs from 'fs';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import {
  createProductDto,
  imageInput,
  updateImage,
} from './dtos/createProduct.input';
import { updateProductDto } from './dtos/updateProduct.input';
import { JwtAuthGuard } from 'src/auth/guards/jwtRest.guard';
import { RestRolesGuard } from 'src/auth/guards/roles.rest.guard';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('product')
@UsePipes(new ValidationPipe())
export class ProductController {
  private logger = new Logger(ProductController.name);
  constructor(
    private productService: productService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post('create')
  @ROLES(Roles.ADMIN)
  @UseGuards(JwtAuthGuard, RestRolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // storage: diskStorage({
      //     destination: './images',
      //     filename: (req, file, callback) => {
      //         const sanitized = file.originalname.replace(/\s+/g, '-') // replace spaces with dashes
      //         const uniqueName = `${Date.now()}-${sanitized}`
      //         callback(null, uniqueName)
      //     }
      // }) local disk storage
      storage: memoryStorage(),
    }),
  )
  async createProduct(
    @UploadedFile() file: Express.Multer.File,
    @Body() productPayload: createProductDto,
  ) {
    //console.log(productPayload);
    const uploadedImage = await this.cloudinaryService.uploadImage(file);
    const fileName = file.filename;
    const fileMetadata: imageInput = {
      originalName: file.originalname || file.filename,
      //fileName,
      fileName: uploadedImage.public_id,
      mimeType: file.mimetype,
      fileSize: file.size,
      //filepath: file.path,
      filepath: uploadedImage.secure_url,
    };
    try {
      return await this.productService.createNewProduct(
        productPayload,
        fileMetadata,
      );
    } catch (error) {
      //incase there is an error saving file remove the saved image
      //await fs.promises.unlink(file.path).catch(() => { })
      await this.cloudinaryService
        .deleteImage(uploadedImage.public_id)
        .catch(() => {});
      throw error;
    }
  }

  @Patch('update/:productId')
  @ROLES(Roles.ADMIN)
  @UseGuards(JwtAuthGuard, RestRolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // storage: diskStorage({
      //     destination: './images',
      //     filename: (req, file, callback) => {
      //         const sanitized = file.originalname.replace(/\s+/g, '-') // replace spaces with dashes
      //         const uniqueName = `${Date.now()}-${sanitized}`
      //         callback(null, uniqueName)
      //     }
      // })
      storage: memoryStorage(),
    }),
  )
  async updateProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updatePayload: updateProductDto,
  ) {
    //console.log(updatePayload);
    const foundProduct = await this.productService.getProductDetails(productId);
    const filePath = foundProduct.images[0].filepath;
    const oldPublicId = foundProduct.images[0]?.fileName;
    let fileMetadata: updateImage = {};
    if (file) {
      this.logger.log(`New image uploading replacing the old image`);
      try {
        if (filePath) {
          //remove old image
          // await fs.promises.unlink(filePath).catch(() => {
          //     this.logger.warn(`Old file not found on disk: ${filePath}`);
          // })
          const uploadedImage = await this.cloudinaryService.uploadImage(file);
          await this.cloudinaryService.deleteImage(oldPublicId);
          fileMetadata = {
            //originalName: file.originalname || file.filename,
            //fileName: file.filename,
            fileName: uploadedImage.public_id,
            mimeType: file.mimetype,
            fileSize: file.size,
            //filepath: file.path,
            filepath: uploadedImage.secure_url,
          };
        }
      } catch (error) {
        this.logger.error(`Error occured deleting image ${error.message}`);
        throw error;
      }
    }
    try {
      return await this.productService.updateProduct(
        productId,
        updatePayload,
        fileMetadata,
      );
    } catch (error) {
      if (file) {
        // await fs.promises.unlink(file.path).catch(() => {
        //   this.logger.log('error unlinking file');
        // });
        await this.cloudinaryService.deleteImage(oldPublicId as string);
      }
      throw error;
    }
  }

  @Get('category/:categoryName')
  async getProductByCategory(@Param('categoryName') categoryName: string) {
    return await this.productService.getProductByCategory(categoryName);
  }

  @Get('featured')
  async getFeaturedProducts() {
    return await this.productService.getFeaturedProducts();
  }
}
