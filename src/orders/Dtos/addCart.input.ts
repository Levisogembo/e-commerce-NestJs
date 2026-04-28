import { Field, InputType, Int } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

@InputType()
export class addToCartDto {

    @IsNotEmpty()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsUUID()
    productId: string

    @Type(()=>Number)
    @IsNotEmpty()
    @IsNumber()
    price: number
}