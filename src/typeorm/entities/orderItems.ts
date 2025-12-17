import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Orders } from "./Order";
import { Product } from "./Product";

@Entity({name:'orderItems'})
export class orderItems{
    @PrimaryGeneratedColumn('uuid')
    orderItemId: string

    @Column()
    quantity: number

    @Column()
    unitPrice: number

    @Column()
    subTotal: number

    @ManyToOne(()=>Orders,(order)=>order.OrderItems)
    @JoinColumn()
    Order: Orders

    @ManyToMany(()=>Product,(prod)=>prod.OrderItems)
    @JoinColumn()
    Product: Product

}