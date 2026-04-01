import { Field, InputType, Int } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from "class-validator";

@InputType()
export class orderItemInput {
    @Field()
    @IsNotEmpty()
    @IsUUID()
    productId: string

    @Field(()=>Int)
    @IsNumber()
    quantity: number

    @Field(()=>Int)
    @IsNumber()
    @IsPositive()
    unitPrice: number
}

@InputType()
export class createOrderInput {

    @Field(()=>[orderItemInput])
    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>orderItemInput)
    items: orderItemInput[]

    @Field()
    @IsNotEmpty()
    @IsNumber()
    total: number

    @Field()
    @IsNotEmpty()
    @IsString()
    billingAddress: string

    @Field()
    @IsNotEmpty()
    @IsString()
    paymentMethod: string

    @Field(()=>String)
    @IsOptional()
    phoneNumber?: string
}