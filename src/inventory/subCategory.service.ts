import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/typeorm/entities/Categories";
import { subCategory } from "src/typeorm/entities/subCategory";
import { Repository } from "typeorm";
import { createSubCategoryInput } from "./dtos/createSubCategory.input";
import { updateSubCategoryInput } from "./dtos/updateSubCategory.input";
import { redisInventoryService } from "src/redis/redisInventory.service";


@Injectable()
export class subCategoryService {
    constructor(@InjectRepository(subCategory) private subCategoryRepository: Repository<subCategory>,
        @InjectRepository(Category) private categoryRepository: Repository<Category>,
        private redisInventoryService: redisInventoryService) { }

    async createSubCategory({ category, name, description }: createSubCategoryInput) {
        const foundCategory = await this.categoryRepository.findOne({ where: { categoryId: category } })
        if (!foundCategory) throw new NotFoundException('Category does not exist')
        const nameExists = await this.subCategoryRepository.findOne({ where: { name } })
        if (nameExists) throw new ConflictException('Sub category name already exists')
        const newSubCategory = await this.subCategoryRepository.create({
            name,
            description,
            category: foundCategory
        })
        const savedSubCategory = await this.subCategoryRepository.save(newSubCategory)
        //save category once it is created
        const cacheKey = `subCategory:${savedSubCategory.subCategoryId}`
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(savedSubCategory), 3600)
        return savedSubCategory
    }

    async updateSubCategory(subCategoryId: string, { category, name, description }: updateSubCategoryInput) {
        const foundSubCategory = await this.subCategoryRepository.findOne({ where: { subCategoryId } })
        if (!foundSubCategory) throw new NotFoundException('Sub category does not exist')
        let newCategory: any = null
        if (category) {
            newCategory = await this.categoryRepository.findOne({ where: { categoryId: category } })
            if (!newCategory) throw new NotFoundException('Category not found')
        }
        if (name && name === foundSubCategory.name) throw new ConflictException('Name already exists')
        if (newCategory) {
            await this.subCategoryRepository.update(subCategoryId, { name, description, category: newCategory })
        } else {
            await this.subCategoryRepository.update(subCategoryId, { name, description })
        }
        const cacheKey = `subCategory:${subCategoryId}`
        //delete item from cache before updating
        await this.redisInventoryService.removeItem(cacheKey)
        const updatedItem = await this.subCategoryRepository.findOne({ where: { subCategoryId } })
        //store updated item
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(updatedItem), 3600)
        return updatedItem
    }

    async getSubCategory(subCategoryId: string) {
        //check to see if item is in cache
        const cacheKey = `subCategory:${subCategoryId}`
        const cachedItem = await this.redisInventoryService.getItem(cacheKey)
        if (cachedItem) {
            return JSON.parse(cachedItem)
        }

        const foundItem = await this.subCategoryRepository.findOne({ where: { subCategoryId }, relations:['category'] })
        if (!foundItem) throw new NotFoundException('Sub category not found')
        await this.redisInventoryService.storeItem(cacheKey, JSON.stringify(foundItem), 3600)
        return foundItem
    }

    async deleteSubCategory(subCategoryId: string) {
        const foundItem = await this.subCategoryRepository.findOne({ where: { subCategoryId } })
        if (!foundItem) throw new NotFoundException('Sub category not found')
        await this.subCategoryRepository.delete(subCategoryId)
        return "Subcategory Deleted successfully"
    }
}