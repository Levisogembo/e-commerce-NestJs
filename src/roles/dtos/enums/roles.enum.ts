import { registerEnumType } from "@nestjs/graphql";

export enum Roles {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

registerEnumType(Roles,{name:'Roles'})