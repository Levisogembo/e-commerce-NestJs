import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { orderItems } from "./orderItems";
import { User } from "./User";
import { Payments } from "./Payments";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'orders'})
export class Orders{
    @Field()
    @PrimaryGeneratedColumn('uuid')
    orderId: string

    @Field()
    @Column()
    total: number

    @Field()
    @Column()
    status: string

    @Field()
    @Column()
    billingAddress: string

    @Field()
    @Column()
    paymentMethod: string

    @Field()
    @Column()
    createdAt: Date

    @Field(()=>[orderItems])
    @OneToMany(()=>orderItems,(items)=>items.Order)
    OrderItems: orderItems[]

    @Field(()=>User)
    @ManyToOne(()=>User,(user)=>user.orders)
    @JoinColumn()
    user: User

    @Field(()=>[Payments])
    @OneToMany(()=>Payments,(pay)=>pay.order)
    payments: Payments[]
}