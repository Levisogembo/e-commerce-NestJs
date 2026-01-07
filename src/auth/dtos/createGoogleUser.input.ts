import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class createGoogleUser{
    @Field()
    @IsNotEmpty()
    @IsString()
    given_name: string

    @Field()
    @IsNotEmpty()
    @IsString()
    family_name: string
}