import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/decorators/userToken.decorator';
import { Orders } from 'src/typeorm/entities/Order';
import { createOrderInput } from './Dtos/createOrder.input';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtGqlGuard } from 'src/auth/guards/jwt.guard';
import { jwtPayloadDto } from 'src/auth/dtos/jwtPayload.dto';
import { returnOrderResponse } from './Dtos/returnOrder.input';
import { OrdersService } from './orders.service';

@Resolver(()=>Orders)
@UseGuards(JwtGqlGuard)
@UsePipes(new ValidationPipe())
export class OrdersResolver {
    constructor(private orderService: OrdersService){}

    @Mutation(()=>returnOrderResponse)
    async createNewOrder(@CurrentUser() userToken: jwtPayloadDto, @Args('orderPayload') payload: createOrderInput){
        const userId = userToken.userId
        return await this.orderService.createOrder(userId,payload)
    }
}
