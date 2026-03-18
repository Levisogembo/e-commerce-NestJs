import { Field, ObjectType } from "@nestjs/graphql";
import { Orders } from "src/typeorm/entities/Order";


@ObjectType()
export class returnOrderResponse extends Orders {
    @Field()
    message: string
}