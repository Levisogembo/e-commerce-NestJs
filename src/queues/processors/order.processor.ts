import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { JOB_NAMES, QUEUES } from "../Dtos/queues.constants";
import { Job } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Orders } from "src/typeorm/entities/Order";
import { Repository } from "typeorm";
import { orderItems } from "src/typeorm/entities/orderItems";
import { Product } from "src/typeorm/entities/Product";
import { QueuesService } from "../queues.service";
import { orderStatus } from "src/orders/Dtos/status.enum";
import { throws } from "assert";

@Processor(QUEUES.ORDER)
@Injectable()
export class OrderProcessor extends WorkerHost {
    private readonly logger = new Logger(OrderProcessor.name)
    constructor(@InjectRepository(Orders) private ordersRepository: Repository<Orders>,
        @InjectRepository(orderItems) private orderItemsRepository: Repository<orderItems>,
        @InjectRepository(Product) private productsRepository: Repository<Product>,
        private queueService: QueuesService) {
        super()
        this.logger.log(`Order processor initialized`)
    }

    async process(job: Job<any>) {
        this.logger.log(`processing job ${job.id} of type ${job.name}`);

        try {
            switch (job.name) {
                case JOB_NAMES.PROCESS_ORDER:
                    return await this.handleOrderProcessing(job)

                default:
                    this.logger.warn(`Unknown job type: ${job.name}`)
                    return { success: false, message: 'Unknown job type' }
            }
        } catch (error) {
            this.logger.error(`Job ${job.id} failed: ${error.message}`);
            throw error; // Throwing tells BullMQ to retry the job
        }

    }

    private async handleOrderProcessing(job: Job) {
        const { orderId, userId, items, total, paymentMethod } = job.data
        this.logger.log(`Processing order ${orderId} for ${userId}`)

        await job.updateProgress(10)

        try {
            //update order status to processing
            await this.ordersRepository.update(orderId, { status: orderStatus.PROCESSING })
            this.logger.log('Order status updated to PROCESSING');
            await job.updateProgress(20)

            //check if order is still valid
            const order = await this.ordersRepository.findOne({
                where: { orderId },
                relations: ['orderItems']
            })
            if (!order) throw new NotFoundException('order not found')
            await job.updateProgress(30)

            //simulate payments processing
            this.logger.log('Processing payment...')
            const paymentResult = await this.simulatePayment({ orderId, amount: total, method: paymentMethod })
            if (paymentResult.transactionId) this.logger.log(`Transaction ID: ${paymentResult.transactionId}`)
            await job.updateProgress(50)

            //update inventory according to payment results
            this.logger.log('Step 4: Updating inventory...')
            if (paymentResult.success) {
                //update the reserved inventory as sold
                this.logger.log('Payment successful - committing inventory...')
                await this.ordersRepository.manager.transaction(
                    async (transactionManager) => {
                        const orders = await transactionManager.find(orderItems, {
                            where: { Order: orderId },
                            relations: ['Product']
                        })
                        for (const item of orders) {
                            //update product inventory
                            await transactionManager.createQueryBuilder().update(Product)
                                .set({
                                    quantity: () => `quantity - ${item.quantity}`,
                                    reservedQuantity: () => `reservedQuantity - ${item.quantity}`,
                                    soldQuantity: () => `soldQuantity + ${item.quantity}`
                                })
                                .where('productId = :productId', { productId: item.Product.productId }).execute()
                        }
                        this.logger.log('Inventory committed successfully')

                        //update order status after payment completion
                        await this.ordersRepository.update(orderId, { status: orderStatus.COMPLETED })
                    }
                )
            } else {
                //release the reserved products
                this.logger.log('Payment failed - releasing reserved inventory...')
                await this.ordersRepository.manager.transaction(
                    async (transactionManager) => {
                        const orders = await transactionManager.find(orderItems, {
                            where: { Order: orderId },
                            relations: ['Product']
                        })
                        for (const item of orders) {
                            this.logger.log('Releasing items')
                            await transactionManager.createQueryBuilder().update(Product)
                                .set({
                                    reservedQuantity: () => `reservedQuantity - ${item.quantity}`
                                })
                                .where('productId = :productID', { productId: item.Product.productId }).execute()
                        }
                        this.logger.log('Inventory released successfully')
                    }
                )
            }

            await job.updateProgress(90)
            this.logger.log(`ORDER ${orderId} PROCESSING COMPLETE`)
            await job.updateProgress(100)
            return {
                success: paymentResult.success,
                orderId,
                status: paymentResult.success ? orderStatus.COMPLETED : orderStatus.PAYMENT_FAILED,
                transactionId: paymentResult.transactionId,
                processedAt: new Date().toISOString()
            }
        } catch (error) {
            this.logger.error(`Failed to process order ${orderId}:`, error.message);

            // Update order status to FAILED
            // Update order status to FAILED
            await this.ordersRepository.update(orderId, {
                status: orderStatus.PAYMENT_FAILED
            });

            throw error
        }
    }

    private async simulatePayment(data: {
        orderId: string;
        amount: number;
        method: string;
    }): Promise<{ success: boolean; transactionId?: string; message?: string }> {
        this.logger.log(`   Simulating payment for order ${data.orderId}...`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 80% success rate for testing (you can adjust)
        const isSuccess = Math.random() > 0.2;

        if (isSuccess) {
            return {
                success: true,
                transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                message: 'Payment successful'
            };
        } else {
            return {
                success: false,
                message: 'Payment gateway error: Insufficient funds'
            };
        }
    }
}