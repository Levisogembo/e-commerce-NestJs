import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity({name:'address'})
export class Address{
    @PrimaryGeneratedColumn('uuid')
    addressId: string

    @Column()
    addressLine1: string

    @Column({nullable:true})
    addressLine2: string

    @Column()
    city: string

    @Column()
    state: string

    @Column()
    postalCode: string

    @Column({default:'Kenya'})
    country: string

    @ManyToOne(()=>User,(user)=>user.address)
    @JoinColumn()
    user: User
}