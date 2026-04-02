import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsNumber, IsOptional, IsPhoneNumber, IsString, IsUUID } from "class-validator";
import { Orders } from "src/typeorm/entities/Order";


@ObjectType()
export class returnOrderResponse extends Orders {
    @Field()
    message: string
}

@ObjectType()
export class returnReversalConfirmation {
    @Field()
    success: string

    @Field()
    message: string
}

@ObjectType()
export class returnOrderCancelation {
    @Field()
    success: string

    @Field()
    message: string
}

@InputType()
export class retryPaymentInput {
  @Field()
  @IsUUID()
  orderId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber('KE')
  phoneNumber?: string;  // Optional: allow different phone number for retry
}

@ObjectType()
export class retryPaymentResponse {
    @Field()
    success: boolean

    @Field()
    message: string

    @Field()
    checkoutRequestId?: string
}

@InputType()
export class refundOrderInput {
    @Field()
    @IsOptional()
    @IsNumber()
    amount?: number  // If partial refund, otherwise full amount
    
    @Field()
    @IsString()
    reason: string;
}