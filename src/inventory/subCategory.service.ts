import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/typeorm/entities/Categories";
import { subCategory } from "src/typeorm/entities/subCategory";
import { Repository } from "typeorm";
import { createSubCategoryInput } from "./dtos/createSubCategory.input";
import { updateSubCategoryInput } from "./dtos/updateSubCategory.input";


@Injectable()
export class subCategoryService {
    constructor(@InjectRepository(subCategory) private subCategoryRepository: Repository<subCategory>,
        @InjectRepository(Category) private categoryRepository: Repository<Category>) { }

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
        return await this.subCategoryRepository.save(newSubCategory)
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

        return await this.subCategoryRepository.findOne({ where: { subCategoryId } })
    }

    async getSubCategory(subCategoryId:string){
        const foundItem = await this.subCategoryRepository.findOne({where:{subCategoryId}})
        if(!foundItem) throw new NotFoundException('Sub category not found')
        return foundItem
    }

    async deleteSubCategory(subCategoryId:string){
        const foundItem = await this.subCategoryRepository.findOne({where:{subCategoryId}})
        if(!foundItem) throw new NotFoundException('Sub category not found')
        await this.subCategoryRepository.delete(subCategoryId)
        return "Subcategory Deleted successfully"
    }
}