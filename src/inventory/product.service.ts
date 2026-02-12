import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/typeorm/entities/Categories";
import { Product } from "src/typeorm/entities/Product";
import { subCategory } from "src/typeorm/entities/subCategory";
import { Repository } from "typeorm";
import { createProductInput } from "./dtos/createProduct.input";
import { updateProductInput } from "./dtos/updateProduct.input";
import { redisInventoryService } from "src/redis/redisInventory.service";
import { plainToClass } from "class-transformer";


@Injectable()
export class productService {
    constructor(@InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(Category) private categoryRepository: Repository<Category>,
        @InjectRepository(subCategory) private subCategoryRepository: Repository<subCategory>,
        private readonly redisInventoryService: redisInventoryService) { }

    async createNewProduct({ category, subCategory, ...data }: createProductInput) {
        const foundCategory = await this.categoryRepository.findOne({ where: { categoryId: category } })
        if (!foundCategory) throw new NotFoundException('category not found')
        const foundSubCategory = await this.subCategoryRepository.findOne({ where: { subCategoryId: subCategory } })
        if (!foundSubCategory) throw new NotFoundException('subcategory not found')
        const newProduct = await this.productRepository.create({
            ...data,
            category: foundCategory,
            subCategory: foundSubCategory,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return await this.productRepository.save(newProduct)
    }

    async getProductDetails(productId: string) {
        const cacheKey = `product:${productId}`

        //query from redis
        const cachedProduct = await this.redisInventoryService.getItem(cacheKey)
        if(cachedProduct){
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
        await this.redisInventoryService.storeItem(cacheKey,JSON.stringify(product),600)
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

    async updateProduct(productId: string, { category, subCategory, ...data }: updateProductInput) {
        const foundProduct = await this.productRepository.findOne({
            where:{productId},
            relations: ['category','subCategory']
        })
        if(!foundProduct) throw new NotFoundException('product not found')
        if (category && subCategory) {
            const foundCategory = await this.categoryRepository.findOne({ where: { categoryId: category } })
            if (!foundCategory) throw new NotFoundException('category not found')
            const foundSubCategory = await this.subCategoryRepository.findOne({
                where: { subCategoryId: subCategory },
                relations: ['category']
            })
            if (!foundSubCategory) throw new NotFoundException('subcategory not found')
            if (foundCategory.name !== foundSubCategory.category.name) throw new ConflictException(`${foundSubCategory.name} subcategory does not belong ${foundCategory.name} category`)
            await this.productRepository.update(productId, {
                ...data,
                category: foundCategory,
                subCategory: foundSubCategory,
                updatedAt: new Date()
            })
            return await this.productRepository.findOne({ where: { productId } })
        } else if (category && !subCategory) {
            const foundCategory = await this.categoryRepository.findOne({ where: { categoryId: category } })
            if (!foundCategory) throw new NotFoundException('category not found')
            //if (foundCategory.name !== foundProduct.subCategory.)
            await this.productRepository.update(productId, {
                ...data,
                category: foundCategory,
                updatedAt: new Date()
            })
            return await this.productRepository.findOne({ where: { productId } })
        } else if (subCategory && !category) {
            const foundSubCategory = await this.subCategoryRepository.findOne({
                where: { subCategoryId: subCategory },
                relations: ['category']
            })
            if (!foundSubCategory) throw new NotFoundException('subcategory not found')
            if (foundProduct.category.name !== foundSubCategory.category.name) throw new ConflictException(`${foundSubCategory.name} subcategory does not belong ${foundProduct.category.name} category`)
            await this.productRepository.update(productId, {
                ...data,
                subCategory: foundSubCategory,
                updatedAt: new Date()
            })
            return await this.productRepository.findOne({ where: { productId } })
        } else {
            await this.productRepository.update(productId, {
                ...data,
                updatedAt: new Date()
            })
            return await this.productRepository.findOne({ where: { productId } })
        }
    }
}