import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Categories";
import { Product } from "./Product";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'subCategories'})
export class subCategory {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    subCategoryId: string

    @Field()
    @Column({unique:true})
    name: string

    @Field()
    @Column()
    description: string

    @Field(()=>Category)
    @ManyToOne(()=>Category,(cat)=>cat.subCategories)
    @JoinColumn()
    category: Category

    @Field(()=>[Product])
    @OneToMany(()=>Product,(prod)=>prod.category)
    Product: Product[]
}