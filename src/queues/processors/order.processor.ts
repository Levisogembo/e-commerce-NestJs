import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { JOB_NAMES, QUEUES } from "../Dtos/queues.constants";
import { Job } from "bullmq";

@Processor(QUEUES.ORDER)
@Injectable()
export class OrderProcessor extends WorkerHost {
    private readonly logger = new Logger(OrderProcessor.name)
    constructor() { super() }

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
        await new Promise(resolve => setTimeout(resolve, 10));
        try {
            //update order status to processing
            // await this.ordersService.updateStatus(orderId, 'PROCESSING');
            await job.updateProgress(60)
            await new Promise(resolve => setTimeout(resolve, 50));
            //checking if product is still available
            for (const item of items) {
                this.logger.log(`- Checking product ${item.productId} (qty: ${item.quantity})`)
                await job.updateProgress(60)
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            //process payment
            await job.updateProgress(60)
            await new Promise(resolve => setTimeout(resolve, 150));
            //update inventory

            //update order status
            // await this.ordersService.updateStatus(orderId, 'COMPLETED');

            //email confirmation message

            return {
                success: true,
                orderId,
                message: 'Order processed successfully',
                processedAt: new Date().toISOString()
            }
        } catch (error) {
            this.logger.error(`Failed to process order ${orderId}:`, error.message);

            // Update order status to FAILED
            // await this.ordersService.updateStatus(orderId, 'PROCESSING_FAILED');

            throw error; // Let BullMQ handle retry
        }
    }
}