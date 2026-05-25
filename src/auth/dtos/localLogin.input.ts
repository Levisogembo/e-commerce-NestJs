import { Field, InputType, ObjectType } from "@nestjs/graphql";
import {IsEmail,IsNotEmpty, IsString } from 'class-validator'

@InputType()
export class localInput{
    @Field()
    @IsNotEmpty()
    @IsEmail()
    email: string

    @Field()
    @IsNotEmpty()
    @IsString()
    password:string
}

@ObjectType()
export class AuthResponse {
    @Field()
    accessToken: string

    @Field()
    refreshToken: string
}