import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";
import { Category } from "src/typeorm/entities/Categories";

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

@ObjectType()
export class PaginatedCategories {
    @Field(() => [Category])
    category: Category[]

    @Field(() => Number)
    total: number
}