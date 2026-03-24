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
import { User } from "src/typeorm/entities/User";

@Processor(QUEUES.ORDER)
@Injectable()
export class OrderProcessor extends WorkerHost {
    private readonly logger = new Logger(OrderProcessor.name)
    constructor(@InjectRepository(Orders) private ordersRepository: Repository<Orders>,
        @InjectRepository(orderItems) private orderItemsRepository: Repository<orderItems>,
        @InjectRepository(Product) private productsRepository: Repository<Product>,
        @InjectRepository(User) private userRepository: Repository<User>,
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
        const workerId = `${process.pid}-${Date.now()}`
        this.logger.log(`[START] Job ${job.id} | worker=${workerId} | attempts=${job.attemptsMade}`)
        this.logger.log(`Processing order ${orderId} for ${userId}`)


        try {
            const user = await this.userRepository.findOne({
                where: {userId},
                select: {email:true,firstName:true}
            })
            if(!user) throw new NotFoundException('User not found')
            
            //update order status to processing
            await this.ordersRepository.update(orderId, { status: orderStatus.PROCESSING })
            this.logger.log('Order status updated to PROCESSING');
            //await this.safeUpdateProgress(job, 20)

            //check if order is still valid
            const order = await this.ordersRepository.findOne({
                where: { orderId },
                relations: ['orderItems']
            })
            if (!order) throw new NotFoundException('order not found')
            //await this.safeUpdateProgress(job, 30)

            //simulate payments processing
            this.logger.log('Processing payment...')
            const paymentResult = await this.simulatePayment({ orderId, amount: total, method: paymentMethod })
            if (paymentResult.transactionId) this.logger.log(`Transaction ID: ${paymentResult.transactionId}`)
            //await this.safeUpdateProgress(job, 50)

            //update inventory according to payment results
            this.logger.log('Updating inventory...')
            if (paymentResult.success) {
                //update the reserved inventory as sold
                this.logger.log('Payment successful - committing inventory...')
                await this.ordersRepository.manager.transaction(
                    async (transactionManager) => {
                        const orders = await transactionManager.find(orderItems, {
                            where: { Order: { orderId } },
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
                        await transactionManager.update(Orders, orderId, {
                            status: orderStatus.COMPLETED
                        });
                    }
                
                )
                //send confirmation email to user
                await this.queueService.addEmailJobData({
                    to: user.email,
                    subject: `Order ${orderId} Confirmed!`,
                    template: 'orderSuccess',
                    data: {
                        orderId,
                        total,
                        items,
                        transactionId: paymentResult.transactionId,
                        date: new Date().toISOString()
                    }
                })
                this.logger.log(`Email queued to ${user.email}`)

            } else {
                //release the reserved products
                this.logger.log('Payment failed - releasing reserved inventory...')
                await this.ordersRepository.manager.transaction(
                    async (transactionManager) => {
                        const orders = await transactionManager.find(orderItems, {
                            where: { Order: { orderId } },
                            relations: ['Product']
                        })
                        for (const item of orders) {
                            this.logger.log('Releasing items')
                            await transactionManager
                                .createQueryBuilder()
                                .update(Product)
                                .set({
                                    reservedQuantity: () => `reservedQuantity - :qty`
                                })
                                .where('productId = :productId', {
                                    productId: item.Product.productId,
                                    qty: item.quantity
                                })
                                .execute();
                        }
                        this.logger.log('Inventory released successfully')
                    }
                )
                //send failure message to user
                await this.queueService.addEmailJobData({
                    to: user.email,
                    subject: `Payment failed for order ${orderId}`,
                    template: 'orderFailure',
                    data: {
                        orderId,
                        total,
                        items,
                        date: new Date().toISOString()
                    }
                })
                this.logger.log(`Email queued to ${user.email}`)
            }
            const start = Date.now();
            //await this.safeUpdateProgress(job, 90)
            this.logger.log(`ORDER ${orderId} PROCESSING COMPLETE`)
            this.logger.log(
                `[END] Job ${job.id} | worker=${workerId}`
              );
              this.logger.log(
                `[TIME] Job ${job.id} took ${Date.now() - start}ms`
              );
            //await this.safeUpdateProgress(job, 100)
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