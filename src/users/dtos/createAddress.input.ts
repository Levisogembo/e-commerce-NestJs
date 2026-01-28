import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

@InputType()
export class createAddressInput {
    @IsNotEmpty()
    @IsString()
    @MinLength(10)
    @MaxLength(10)
    @Field()
    phoneNumber: string

    @IsNotEmpty()
    @IsString()
    @Field()
    addressLine1: string

    @IsOptional()
    @IsString()
    @Field(()=>String,{nullable:true})
    addressLine2?: string

    @IsNotEmpty()
    @IsString()
    @Field()
    city: string

    @IsNotEmpty()
    @IsString()
    @Field()
    state: string

    @IsNotEmpty()
    @IsString()
    @Field()
    postalCode: string

    @IsNotEmpty()
    @IsString()
    @Field()
    country: string
}