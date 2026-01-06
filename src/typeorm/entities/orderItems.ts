import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Orders } from "./Order";
import { Product } from "./Product";
import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'orderItems'})
export class orderItems{
    @Field()
    @PrimaryGeneratedColumn('uuid')
    orderItemId: string

    @Field(()=>Int)
    @Column()
    quantity: number

    @Field(()=>Int)
    @Column()
    unitPrice: number

    @Field(()=>Int)
    @Column()
    subTotal: number

    @Field(()=>Orders)
    @ManyToOne(()=>Orders,(order)=>order.OrderItems)
    @JoinColumn()
    Order: Orders

    @Field(()=>Product)
    @ManyToMany(()=>Product,(prod)=>prod.OrderItems)
    @JoinColumn()
    Product: Product

}