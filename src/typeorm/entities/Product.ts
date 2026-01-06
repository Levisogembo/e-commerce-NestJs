import { Column, Entity, In, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Categories";
import { subCategory } from "./subCategory";
import { orderItems } from "./orderItems";
import { Images } from "./Images";
import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'products'})
export class Product{
    @Field()
    @PrimaryGeneratedColumn('uuid')
    productId: string

    @Field()
    @Column()
    name: string

    @Field()
    @Column()
    description: string

    @Field()
    @Column()
    brand: string

    @Field(()=>Int)
    @Column()
    price: number

    @Field(()=>Int)
    @Column()
    quantity: number

    @Field()
    @Column()
    createdAt: Date

    @Field()
    @Column()
    updatedAt: Date

    @Field(()=>Category)
    @ManyToOne(()=>Category,(cat)=>cat.Product)
    @JoinColumn()
    category: Category

    @Field(()=>subCategory)
    @ManyToOne(()=>subCategory,(sub)=>sub.Product)
    @JoinColumn()
    subCategory: subCategory

    @Field(()=>[orderItems])
    @ManyToMany(()=>orderItems,(order)=>order.Product)
    OrderItems: orderItems[]

    @Field(()=>[Images])
    @OneToMany(()=>Images,(img)=>img.Product)
    images: Images[]
}