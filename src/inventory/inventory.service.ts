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
    private readonly CATEGORY_OPTIONS_KEY = 'categories:options'
    private readonly CATEGORY_PAGE_PATTERN = 'categories:page:'

    constructor(@InjectRepository(Category) private categoryRepository: Repository<Category>,
        private redisInventoryService: redisInventoryService) { }

    async createNewCategory({ name, description }: createCategoryInput) {
        const existingCategory = await this.categoryRepository.findOne({ where: { name } })
        if (existingCategory) throw new ConflictException('Category name already exists')
        let newCategory = await this.categoryRepository.create({ name, description })
        const savedCategory = await this.categoryRepository.save(newCategory)
        const cacheKey = `category:${savedCategory.categoryId}`
        const cachedOptions = await this.redisInventoryService.getItem(this.CATEGORY_OPTIONS_KEY)
        if (cachedOptions) {
            const parsed = JSON.parse(cachedOptions)
            parsed.push(savedCategory)
            //update redis with the new category created
            await this.redisInventoryService.storeItem(this.CATEGORY_OPTIONS_KEY, JSON.stringify(parsed), 3600)
        }
        //delete paginated patterns
        await this.redisInventoryService.deleteByPattern(this.CATEGORY_PAGE_PATTERN)
        //await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(savedCategory), 3600)
        return savedCategory
    }

    async updateCategory(categoryId: string, payload: updateCategoryInput) {
        //console.log(payload);      
        const existingCategory = await this.categoryRepository.findOne({ where: { categoryId } })
        if (!existingCategory) throw new NotFoundException('Category not found')
        if (payload.name === existingCategory.name) throw new ConflictException('Category name already exists')

        await this.categoryRepository.update(categoryId, payload)
        const updatedCategory = await this.categoryRepository.findOne({ where: { categoryId } })
        const cacheKey = `category:${categoryId}`
        //console.log('updated category', updatedCategory);

        const cachedOptions = await this.redisInventoryService.getItem(this.CATEGORY_OPTIONS_KEY)
        if (cachedOptions) {
            const parsed = JSON.parse(cachedOptions)
            //remove null values from the cache in case of bugs
            const cleaned = parsed.filter((cat) => cat !== null && cat !== undefined)

            const updatedCategories = cleaned.map((cat) =>
                cat.categoryId === categoryId ? updatedCategory : cat
            )
            await this.redisInventoryService.storeItem(this.CATEGORY_OPTIONS_KEY, JSON.stringify(updatedCategories), 3600)
        }
        //await this.redisInventoryService.removeItem(cacheKey)
        await this.redisInventoryService.deleteByPattern(this.CATEGORY_PAGE_PATTERN)
        //await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(updatedCategory), 3600)
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

    async getAllCategories(page: number, limit: number) {
        const offset = (page - 1) * limit
        const cacheKey = `${this.CATEGORY_PAGE_PATTERN}${page}:limit:${limit}`
        const cachedItem = await this.redisInventoryService.getItem(cacheKey)
        if (cachedItem) {
            return JSON.parse(cachedItem)
        }
        const [category, total] = await this.categoryRepository.findAndCount({
            skip: offset,
            take: limit,
        })
        if (!category.length) throw new NotFoundException('Category not found')
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify({ category, total }), 3600)
        return { category, total }
    }

    async getCategoryOptions() {
        const cachedItem = await this.redisInventoryService.getItem(this.CATEGORY_OPTIONS_KEY)
        if (cachedItem) return JSON.parse(cachedItem)

        const categories = await this.categoryRepository.find({
            select: ['categoryId', 'name'],  // only fetch what dropdown needs
            order: { name: 'ASC' }
        })

        await this.redisInventoryService.storeItem(
            this.CATEGORY_OPTIONS_KEY,
            JSON.stringify(categories),
            3600
        )

        return categories
    }

    async deleteCategory(categoryId: string) {
        await this.categoryRepository.softDelete(categoryId)

        // update options cache
        const cachedOptions = await this.redisInventoryService.getItem(this.CATEGORY_OPTIONS_KEY)

        if (cachedOptions) {
            const parsed = JSON.parse(cachedOptions)
            const filteredList = parsed.filter((cat) => cat.categoryId !== categoryId)  // remove deleted
            await this.redisInventoryService.storeItem(
                this.CATEGORY_OPTIONS_KEY,
                JSON.stringify(filteredList),
                3600
            )
        }

        // invalidate paginated cache
        await this.redisInventoryService.deleteByPattern(this.CATEGORY_PAGE_PATTERN)
        return 'Category deleted successfully'
    }
}
