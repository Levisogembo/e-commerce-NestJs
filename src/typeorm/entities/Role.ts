import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity({name:'roles'})
export class Role {
    @PrimaryGeneratedColumn('uuid')
    roleId: string

    @Column()
    name:string

    @ManyToMany(()=>User,(user)=>user.role)
    user: User []

}