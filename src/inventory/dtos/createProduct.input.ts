import { Field, InputType, Int } from "@nestjs/graphql";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

@InputType()
export class createProductInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    name: string

    @Field()
    @IsNotEmpty()
    @IsString()
    description: string

    @Field()
    @IsNotEmpty()
    @IsString()
    brand: string

    @Field(()=>Int)
    @IsNotEmpty()
    @IsNumber()
    price: number

    @Field(()=>Int)
    @IsNotEmpty()
    @IsNumber()
    quantity: number

    @Field()
    @IsNotEmpty()
    @IsString()
    category: string

    @Field()
    @IsNotEmpty()
    @IsString()
    subCategory: string
}