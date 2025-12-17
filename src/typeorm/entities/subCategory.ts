import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Categories";
import { Product } from "./Product";

@Entity({name:'subCategories'})
export class subCategory {
    @PrimaryGeneratedColumn('uuid')
    subCategoryId: string

    @Column()
    name: string

    @Column()
    description: string

    @ManyToOne(()=>Category,(cat)=>cat.subCategories)
    @JoinColumn()
    category: Category

    @OneToMany(()=>Product,(prod)=>prod.category)
    Product: Product[]
}