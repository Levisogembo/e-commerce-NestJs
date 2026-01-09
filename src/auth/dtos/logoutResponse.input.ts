import { Field, InputType, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class logoutResponseInput{
    @Field()
    success: boolean

    @Field(()=>String,{nullable:true})
    message: string

    @Field(()=>String,{nullable:true})
    timeStamp: string
}