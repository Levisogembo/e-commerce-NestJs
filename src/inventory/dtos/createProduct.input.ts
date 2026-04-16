import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { Product } from "src/typeorm/entities/Product";
import  {PartialType} from '@nestjs/mapped-types'

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

export class createProductDto { 
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsString()
    brand: string

    @Type(()=> Number)
    @IsNotEmpty()
    @IsNumber()
    price: number
 
    @Type(()=> Number)
    @IsNotEmpty()
    @IsNumber()
    quantity: number

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

export class updateImage extends PartialType(imageInput){}

@ObjectType()
export class PaginatedProducts {
    @Field(() => [Product])
    products: Product[]

    @Field(() => Number)
    total: number
}