import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'address'})
export class Address{
    @Field()
    @PrimaryGeneratedColumn('uuid')
    addressId: string

    @Field()
    @Column()
    phoneNumber: string

    @Field()
    @Column()
    addressLine1: string

    @Field(()=>String,{nullable:true})
    @Column({nullable:true})
    addressLine2?: string

    @Field()
    @Column()
    city: string

    @Field()
    @Column()
    state: string

    @Field()
    @Column()
    postalCode: string

    @Field()
    @Column({default:'Kenya'})
    country: string

    @Field(()=>User)
    @OneToOne(()=>User,(user)=>user.address)
    user: User
}