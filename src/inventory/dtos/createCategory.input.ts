import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class createCategoryInput{
    @Field()
    @IsNotEmpty()
    @IsString()
    name: string

    @Field()
    @IsNotEmpty()
    @IsString()
    description: string
}