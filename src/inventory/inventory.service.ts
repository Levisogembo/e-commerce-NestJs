import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from 'src/typeorm/entities/Categories';
import { InventoryResolver } from './inventory.resolver';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCategoryInput } from './dtos/createCategory.input';
import { updateCategoryInput } from './dtos/updateCategory.input';
import { log } from 'util';
import { redisInventoryService } from 'src/redis/redisInventory.service';

@Injectable()
export class InventoryService {
    constructor(@InjectRepository(Category) private categoryRepository: Repository<Category>,
        private redisInventoryService: redisInventoryService) { }

    async createNewCategory({ name, description }: createCategoryInput) {
        const existingCategory = await this.categoryRepository.findOne({ where: { name } })
        if (existingCategory) throw new ConflictException('Category name already exists')
        let newCategory = await this.categoryRepository.create({ name, description })
        const savedCategory = await this.categoryRepository.save(newCategory)
        const cacheKey = `category:${savedCategory.categoryId}`
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(savedCategory), 3600)
        return savedCategory
    }

    async updateCategory(categoryId: string, payload: updateCategoryInput) {
        //console.log(payload);      
        const existingCategory = await this.categoryRepository.findOne({ where: { categoryId } })
        if (!existingCategory) throw new NotFoundException('Category not found')
        if (payload.name === existingCategory.name) throw new ConflictException('Category name already exists')

        await this.categoryRepository.update(categoryId, payload)
        const cacheKey = `category:${categoryId}`
        await this.redisInventoryService.removeItem(cacheKey)
        const updatedCategory = await this.categoryRepository.findOne({ where: { categoryId } })
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(updatedCategory), 3600)
        return updatedCategory
        //return "Category Updated successfully"
    }

    async getCategory(categoryId: string) {
        const cacheKey = `category:${categoryId}`
        const cachedItem = await this.redisInventoryService.getItem(cacheKey)
        if (cachedItem) {
            return JSON.parse(cachedItem)
        }
        const category = await this.categoryRepository.findOne({ where: { categoryId } })
        if (!category) throw new NotFoundException('Category not found')
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(category), 3600)
        return category
    }
}
