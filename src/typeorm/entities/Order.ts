import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { orderItems } from "./orderItems";
import { User } from "./User";
import { Payments } from "./Payments";

@Entity({name:'orders'})
export class Orders{
    @PrimaryGeneratedColumn('uuid')
    orderId: string

    @Column()
    total: number

    @Column()
    status: string

    @Column()
    billingAddress: string

    @Column()
    paymentMethod: string

    @Column()
    createdAt: Date

    @OneToMany(()=>orderItems,(items)=>items.Order)
    OrderItems: orderItems[]

    @ManyToOne(()=>User,(user)=>user.orders)
    @JoinColumn()
    user: User

    @OneToMany(()=>Payments,(pay)=>pay.order)
    payments: Payments[]
}