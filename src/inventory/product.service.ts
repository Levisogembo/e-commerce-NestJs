import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/typeorm/entities/Categories";
import { Product } from "src/typeorm/entities/Product";
import { subCategory } from "src/typeorm/entities/subCategory";
import { Repository } from "typeorm";
import { createProductInput, imageInput } from "./dtos/createProduct.input";
import { updateProductInput } from "./dtos/updateProduct.input";
import { redisInventoryService } from "src/redis/redisInventory.service";
import { plainToClass } from "class-transformer";
import { Images } from "src/typeorm/entities/Images";


@Injectable()
export class productService {
    constructor(@InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(Category) private categoryRepository: Repository<Category>,
        @InjectRepository(Images) private imagesRepository: Repository<Images>,
        private readonly redisInventoryService: redisInventoryService) { }

    async createNewProduct({ category, ...data }: createProductInput, fileMetadata: imageInput) {
        const foundCategory = await this.categoryRepository.findOne({ where: { categoryId: category } })
        if (!foundCategory) throw new NotFoundException('category not found')

        const newProduct = await this.productRepository.manager.transaction(async (transactionManager) => {
            const newProduct = transactionManager.create(Product, {
                ...data,
                category: foundCategory,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            const savedProduct = await transactionManager.save(newProduct)

            const newImage = await transactionManager.create(Images, {
                fileName: fileMetadata.fileName,
                mimeType: fileMetadata.mimeType,
                filepath: fileMetadata.filePath,
                fileSize: fileMetadata.fileSize,
                uploadedAt: new Date(),
                Product: savedProduct
            })
            await transactionManager.save(newImage)
            return savedProduct
        })
        return newProduct
    }

    async getProductDetails(productId: string) {
        const cacheKey = `product:${productId}`

        //query from redis
        const cachedProduct = await this.redisInventoryService.getItem(cacheKey)
        if (cachedProduct) {
            const productData = JSON.parse(cachedProduct);

            // Convert all date strings back to Date objects
            if (productData.createdAt) {
                productData.createdAt = new Date(productData.createdAt);
            }
            if (productData.updatedAt) {
                productData.updatedAt = new Date(productData.updatedAt);
            }
            return productData as Product;
        }


        //cache miss query from db
        const product = await this.productRepository.findOne(
            {
                where: { productId },
                relations: ['category', 'subCategory']
            })
        if (!product) throw new NotFoundException('Product not found')

        //store in redis once product is found, ttl is 10 minutes
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(product), 600)
        return product
    }

    async getProducts(page: number, limit: number) {
        const offset = (page - 1) * limit
        const foundProducts = await this.productRepository.find({
            skip: offset,
            take: limit
        })
        if (!foundProducts.length) throw new HttpException('No products at the moment', HttpStatus.NOT_FOUND)
        return foundProducts
    }

    async deleteProduct(productId: string) {
        await this.productRepository.findOneByOrFail({ productId })
        await this.productRepository.delete(productId)
        return "Product deleted successfully"
    }

    async updateProduct(productId: string, { category, ...data }: updateProductInput) {
        const cacheKey = `product:${productId}`
        const foundProduct = await this.productRepository.findOne({
            where: { productId },
            relations: ['category']
        })
        if (!foundProduct) throw new NotFoundException('product not found')
        //delete existing product information from the cache
        await this.redisInventoryService.removeItem(cacheKey)
        if (category) {
            const foundCategory = await this.categoryRepository.findOne({ where: { categoryId: category } })
            if (!foundCategory) throw new NotFoundException('category not found')
            // const foundSubCategory = await this.subCategoryRepository.findOne({
            //     where: { subCategoryId: subCategory },
            //     relations: ['category']
            // })
            // if (!foundSubCategory) throw new NotFoundException('subcategory not found')
            //if (foundCategory.name !== foundSubCategory.category.name) throw new ConflictException(`${foundSubCategory.name} subcategory does not belong ${foundCategory.name} category`)
            await this.productRepository.update(productId, {
                ...data,
                category: foundCategory,
                //subCategory: foundSubCategory,
                updatedAt: new Date()
            })
            const updatedProduct = await this.productRepository.findOne({ where: { productId } })
            //update cache with new product details
            await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(updatedProduct), 600)
            return updatedProduct
        }
        // else if (subCategory && !category) {
        //     const foundSubCategory = await this.subCategoryRepository.findOne({
        //         where: { subCategoryId: subCategory },
        //         relations: ['category']
        //     })
        //     if (!foundSubCategory) throw new NotFoundException('subcategory not found')
        //     if (foundProduct.category.name !== foundSubCategory.category.name) throw new ConflictException(`${foundSubCategory.name} subcategory does not belong ${foundProduct.category.name} category`)
        //     await this.productRepository.update(productId, {
        //         ...data,
        //         subCategory: foundSubCategory,
        //         updatedAt: new Date()
        //     })
        //     const updatedProduct = await this.productRepository.findOne({ where: { productId } })
        //     //update cache with new product details
        //     await this.redisInventoryService.storeItem(cacheKey,JSON.stringify(updatedProduct),600)
        //     return updatedProduct
        // } 
        else {
            await this.productRepository.update(productId, {
                ...data,
                updatedAt: new Date()
            })
            const updatedProduct = await this.productRepository.findOne({ where: { productId } })
            //update cache with new product details
            await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(updatedProduct), 600)
            return updatedProduct
        }
    }
}