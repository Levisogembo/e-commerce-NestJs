import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { subCategory } from "./subCategory";
import { Product } from "./Product";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'categories'})
export class Category {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    categoryId: string

    @Field()
    @Column()
    name: string

    @Field()
    @Column()
    description: string

    @Field(()=>[subCategory])
    @OneToMany(()=>subCategory,(sub)=>sub.category)
    subCategories: subCategory[]

    @Field(()=>[Product])
    @OneToMany(()=>Product,(prod)=>prod.category)
    Product: Product[]
}