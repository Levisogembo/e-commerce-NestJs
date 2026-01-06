import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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
    addressLine1: string

    @Field()
    @Column({nullable:true})
    addressLine2: string

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
    @ManyToOne(()=>User,(user)=>user.address)
    @JoinColumn()
    user: User
}