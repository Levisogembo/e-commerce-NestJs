import { Column, Entity, JoinColumn, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Address } from "./Addresses";
import { Orders } from "./Order";
import { Payments } from "./Payments";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'users'})
export class User{
    @Field()
    @PrimaryGeneratedColumn('uuid')
    userId: string

    @Field()
    @Column()
    firstName: string

    @Field()
    @Column()
    lastName: string

    @Field()
    @Column()
    phoneNumber: string

    @Field()
    @Column({unique:true})
    email: string

    @Field()
    @Column({nullable:true})
    password?: string

    @Field(()=>Boolean)
    @Column()
    isVerified: boolean

    @Field(()=>Boolean)
    @Column({default:true})
    isActive: boolean

    @Field(()=>Boolean)
    @Column()
    createdAt: Date

    @Field(()=>[Role])
    @ManyToMany(()=>Role,(role)=>role.user)
    @JoinColumn()
    role: Role[]

    @Field(()=>[Address])
    @OneToMany(()=>Address,(address)=>address.user)
    address: Address []

    @Field(()=>[Orders])
    @OneToMany(()=>Orders,(order)=>order.user)
    orders: Orders[]

    @Field(()=>[Payments])
    @OneToMany(()=>Payments,(pay)=>pay.user)
    payments: Payments[]
}