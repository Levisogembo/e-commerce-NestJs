import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({name:'roles'})
export class Role {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    roleId: string

    @Field()
    @Column()
    name:string

    @Field(()=>[User])
    @ManyToMany(()=>User,(user)=>user.role)
    user: User []

}