import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Orders } from "./Order";
import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'payments'})
export class Payments{
    @Field()
    @PrimaryGeneratedColumn('uuid')
    paymentId: string

    @Field()
    @Column({unique:true,nullable:false})
    transactionId: string

    @Field(()=>Int)
    @Column()
    amount: number

    @Field()
    @Column({default:'KES'})
    currency: string

    @Field()
    @Column({nullable:true})
    mpesaNumber:  string

    @Field()
    @Column({nullable:true})
    stripeId: string

    @Field()
    @Column()
    paidAt: Date

    @Field(()=>User)
    @ManyToOne(()=>User,(user)=>user.payments)
    @JoinColumn()
    user: User

    @Field(()=>Orders)
    @ManyToOne(()=>Orders,(order)=>order.payments)
    @JoinColumn()
    order: Orders
}