import { Field, InputType, Int } from "@nestjs/graphql";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

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
    @IsUUID()
    category: string   
}

@InputType()
export class imageInput {
    @Field()
    @IsString()
    originalName: string

    @Field()
    @IsString()
    fileName: string

    @Field()
    @IsString()
    mimeType: string

    @Field()
    @IsString()
    fileSize: number

    @Field()
    @IsString()
    filePath: string
}