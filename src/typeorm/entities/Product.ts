import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Categories";
import { subCategory } from "./subCategory";
import { orderItems } from "./orderItems";

@Entity({name:'products'})
export class Product{
    @PrimaryGeneratedColumn('uuid')
    productId: string

    @Column()
    name: string

    @Column()
    description: string

    @Column()
    brand: string

    @Column()
    price: number

    @Column()
    quantity: number

    @Column()
    createdAt: Date

    @Column()
    updatedAt: Date

    @ManyToOne(()=>Category,(cat)=>cat.Product)
    @JoinColumn()
    category: Category

    @ManyToOne(()=>subCategory,(sub)=>sub.Product)
    @JoinColumn()
    subCategory: subCategory

    @ManyToMany(()=>orderItems,(order)=>order.Product)
    OrderItems: orderItems[]
}