import { Controller, Post } from "@nestjs/common";
import { QueuesService } from "./queues.service";

@Controller('test-q')
export class TestQueueController {
    constructor(private queueService: QueuesService) { }

    // @Post('order')
    // async testOrder() {
    //     const testOrder = {
    //         orderId: `test-${Date.now()}`,
    //         userId: 'user-123',
    //         total: 99.99,
    //         items: [
    //             { productId: 'prod-1', quantity: 2, price: 49.99, name: 'Test Product' }
    //         ],
    //         paymentMethod: 'card',
    //         billingAddress: {
    //             city: 'Nairobi',
    //             address: '123 Test St'
    //         }
    //     }
    //     //const result = await this.queueService.addOrderJob(testOrder)
    //     return {
    //         message: 'Order queued for processing',
    //         //...result
    //       };

    // }
}