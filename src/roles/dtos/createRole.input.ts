import { Field, InputType } from "@nestjs/graphql";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Roles } from "./enums/roles.enum";

@InputType()
export class createRoleInput{
    @Field()
    @IsNotEmpty()
    @IsEnum(Roles,{message:'Role must either be ADMIN or USER'})
    name: Roles
}