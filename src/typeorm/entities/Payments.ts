import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Orders } from "./Order";

@Entity({name:'payments'})
export class Payments{
    @PrimaryGeneratedColumn('uuid')
    paymentId: string

    @Column({unique:true,nullable:false})
    transactionId: string

    @Column()
    amount: number

    @Column({default:'KES'})
    currency: string

    @Column({nullable:true})
    mpesaNumber

    @Column({nullable:true})
    stripeId

    @Column()
    paidAt: Date

    @ManyToOne(()=>User,(user)=>user.payments)
    @JoinColumn()
    user: User

    @ManyToOne(()=>Orders,(order)=>order.payments)
    @JoinColumn()
    order: Orders
}