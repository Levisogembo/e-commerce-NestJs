import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { subCategory } from "./subCategory";
import { Product } from "./Product";

@Entity({name:'categories'})
export class Category {
    @PrimaryGeneratedColumn('uuid')
    categoryId: string

    @Column()
    name: string

    @Column()
    description: string

    @OneToMany(()=>subCategory,(sub)=>sub.category)
    subCategories: subCategory[]

    @OneToMany(()=>Product,(prod)=>prod.category)
    Product: Product[]
}