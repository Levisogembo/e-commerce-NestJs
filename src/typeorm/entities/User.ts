import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Address } from "./Addresses";
import { Orders } from "./Order";
import { Payments } from "./Payments";
import { Field, ObjectType } from "@nestjs/graphql";
import { Roles } from "src/roles/dtos/enums/roles.enum";

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
    @Column({unique:true})
    email: string

    @Field()
    @Column({nullable:true})
    password?: string

    @Field(()=>Boolean)
    @Column({default:false})
    isVerified: boolean

    @Field(()=>Boolean)
    @Column({default:true})
    isActive: boolean

    @Field()
    @Column()
    createdAt: Date

    @Field(()=>Roles)
    @Column({default:Roles.USER})
    role: Roles

    @Field(()=>Address)
    @OneToOne(()=>Address,(address)=>address.user,{
        cascade: true,
        onDelete: 'CASCADE',
        nullable: true
    })
    @JoinColumn()
    address?: Address 

    @Field(()=>[Orders])
    @OneToMany(()=>Orders,(order)=>order.user)
    orders: Orders[]

    @Field(()=>[Payments])
    @OneToMany(()=>Payments,(pay)=>pay.user)
    payments: Payments[]
}