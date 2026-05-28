import { Body, Controller, Post } from "@nestjs/common";
import { MpesaService } from "src/mpesa/mpesa.service";

@Controller('orders')
export class OrdersController {
    constructor (private mpesaService: MpesaService) {}

    @Post('reverse')
    async refundOrder (@Body() {originalTransactionId, amount, orderId, reason}: {originalTransactionId: string, amount: number,orderId: string ,reason: string}) {
        return await this.mpesaService.processReversal(originalTransactionId, amount, orderId , reason)
    }
}