import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from 'src/typeorm/entities/Categories';
import { InventoryResolver } from './inventory.resolver';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCategoryInput } from './dtos/createCategory.input';
import { updateCategoryInput } from './dtos/updateCategory.input';
import { log } from 'util';

@Injectable()
export class InventoryService {
    constructor(@InjectRepository(Category) private categoryRepository: Repository<Category>) { }

    async createNewCategory({ name, description }: createCategoryInput) {
        const existingCategory = await this.categoryRepository.findOne({ where: { name } })
        if (existingCategory) throw new ConflictException('Category name already exists')
        let newCategory = await this.categoryRepository.create({ name, description })
        return await this.categoryRepository.save(newCategory)
    }

    async updateCategory(categoryId: string, payload: updateCategoryInput) {
        //console.log(payload);      
        const existingCategory = await this.categoryRepository.findOne({ where: { categoryId } })
        if (!existingCategory) throw new NotFoundException('Category not found')
        if (payload.name === existingCategory.name) throw new ConflictException('Category name already exists')

        await this.categoryRepository.update(categoryId, payload)
        return await this.categoryRepository.findOne({ where: { categoryId } })
        //return "Category Updated successfully"
    }

    async getCategory(categoryId: string) {
        const category = await this.categoryRepository.findOne({ where: { categoryId } })
        if (!category) throw new NotFoundException('Category not found')
        return category
    }
}
