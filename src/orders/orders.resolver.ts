import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/decorators/userToken.decorator';
import { Orders } from 'src/typeorm/entities/Order';
import { createOrderInput } from './Dtos/createOrder.input';
import { ParseUUIDPipe, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtGqlGuard } from 'src/auth/guards/jwt.guard';
import { jwtPayloadDto } from 'src/auth/dtos/jwtPayload.dto';
import { refundOrderInput, retryPaymentInput, retryPaymentResponse, returnOrderCancelation, returnOrderResponse, returnReversalConfirmation } from './Dtos/returnOrder.input';
import { OrdersService } from './orders.service';
import { OrdersRetryService } from './retries.orders.services';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Cart } from 'src/typeorm/entities/Cart';

@Resolver(()=>Orders)
@UseGuards(JwtGqlGuard)
@UsePipes(new ValidationPipe())
export class OrdersResolver {
    constructor(private orderService: OrdersService, private retryOrderService: OrdersRetryService){}

    @Mutation(()=>returnOrderResponse)
    async createNewOrder(@CurrentUser() userToken: jwtPayloadDto, @Args('orderPayload') payload: createOrderInput){
        const userId = userToken.userId
        return await this.orderService.createOrder(userId,payload)
    }

    @Mutation(()=>returnOrderCancelation)
    async cancelOrder(@CurrentUser() userToken: jwtPayloadDto, @Args('orderId',ParseUUIDPipe) orderId: string){
        const userId = userToken.userId
        return await this.orderService.cancelOrder(orderId, userId)
    }

    @Mutation(()=>retryPaymentResponse)
    async retryOrder (@Args('retryPayload') {orderId, phoneNumber}: retryPaymentInput) {
        return await this.retryOrderService.retryPayment(orderId, phoneNumber)
    }

    @Mutation(()=> returnReversalConfirmation)
    @ROLES(Roles.ADMIN)
    @UseGuards(RolesGuard)
    async processReversal (@Args('orderId',ParseUUIDPipe) orderId: string,@Args('refundPayload') refundPayload: refundOrderInput) {
        return await this.retryOrderService.processReversal(orderId, refundPayload)
    }
}
