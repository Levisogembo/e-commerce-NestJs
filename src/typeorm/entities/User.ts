import { Column, Entity, JoinColumn, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Address } from "./Addresses";
import { Orders } from "./Order";
import { Payments } from "./Payments";

@Entity({name:'users'})
export class User{
    @PrimaryGeneratedColumn('uuid')
    userId: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    phoneNumber: string

    @Column({unique:true})
    email: string

    @Column({nullable:true})
    password: string

    @Column()
    isVerified: boolean

    @Column({default:true})
    isActive: boolean

    @Column()
    createdAt: Date

    @ManyToMany(()=>Role,(role)=>role.user)
    @JoinColumn()
    role: Role[]

    @OneToMany(()=>Address,(address)=>address.user)
    address: Address []

    @OneToMany(()=>Orders,(order)=>order.user)
    orders: Orders[]

    @OneToMany(()=>Payments,(pay)=>pay.user)
    payments: Payments[]
}