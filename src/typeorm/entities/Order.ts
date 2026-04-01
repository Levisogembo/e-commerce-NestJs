import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { orderItems } from "./orderItems";
import { User } from "./User";
import { Payments } from "./Payments";
import { Field, ObjectType } from "@nestjs/graphql";
import { orderStatus } from "src/orders/Dtos/status.enum";

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
    @Column({type:'enum',enum: orderStatus,default:orderStatus.PENDING})
    status: orderStatus

    @Field()
    @Column()
    billingAddress: string

    @Field()
    @Column()
    paymentMethod: string

    @Field()
    @Column({nullable:true})
    mpesaCheckoutRequestId?: string

    @Field()
    @Column({nullable:true})
    transactionId?: string

    @Field()
    @Column()
    createdAt: Date

    @Field({nullable:true})
    @Column({nullable:true})
    paidAt: Date

    @Field(()=>[orderItems])
    @OneToMany(()=>orderItems,(items)=>items.Order)
    orderItems: orderItems[]

    @Field(()=>User)
    @ManyToOne(()=>User,(user)=>user.orders)
    @JoinColumn()
    user: User

    @Field(()=>[Payments])
    @OneToMany(()=>Payments,(pay)=>pay.order)
    payments: Payments[]
}