import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/typeorm/entities/Categories";
import { Product } from "src/typeorm/entities/Product";
import { subCategory } from "src/typeorm/entities/subCategory";
import { Repository } from "typeorm";
import { createProductInput } from "./dtos/createProduct.input";


@Injectable()
export class productService {
    constructor(@InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(Category) private categoryRepository: Repository<Category>,
        @InjectRepository(subCategory) private subCategoryRepository: Repository<subCategory>) { }

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

    async getProductDetails(productId:string){
        const product = await this.productRepository.findOne({where:{productId}})
        if(!product) throw new NotFoundException('Product not found')
        return product
    }

    async getProducts(page: number, limit: number){
        const offset = (page - 1) * limit
        const foundProducts = await this.productRepository.find({
            skip: offset,
            take: limit
        })
        if(!foundProducts.length) throw new HttpException('No products at the moment',HttpStatus.NOT_FOUND)
        return foundProducts
    }

    async deleteProduct(productId: string){
        await this.productRepository.findOneByOrFail({productId})
        await this.productRepository.delete(productId)
        return "Product deleted successfully"
    }
}