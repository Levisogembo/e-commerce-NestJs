import { Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/decorators/userToken.decorator';
import { Orders } from 'src/typeorm/entities/Order';
import { createOrderInput } from './Dtos/createOrder.input';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtGqlGuard } from 'src/auth/guards/jwt.guard';
import { jwtPayloadDto } from 'src/auth/dtos/jwtPayload.dto';

@Resolver(()=>Orders)
@UseGuards(JwtGqlGuard)
@UsePipes(new ValidationPipe())
export class OrdersResolver {
    constructor(){}

    // @Mutation()
    // async createNewOrder(@CurrentUser() userToken: jwtPayloadDto, payload: createOrderInput){}
}
