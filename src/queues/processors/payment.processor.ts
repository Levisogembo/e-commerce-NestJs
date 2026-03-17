import { Processor, WorkerHost } from "@nestjs/bullmq";
import { JOB_NAMES, QUEUES } from "../Dtos/queues.constants";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

@Processor(QUEUES.PAYMENT)
@Injectable()
export class PaymentProcessor extends WorkerHost {
    constructor() { super() }
    private readonly logger = new Logger(PaymentProcessor.name)

    async process(job: Job<any>) {
        this.logger.log(`Processing payment job ${job.id}`)
        try {
            switch (job.name) {
                case JOB_NAMES.PROCESS_PAYMENT:
                    return await this.processPayment(job)

                default:
                    this.logger.warn(`Unknown payment job type: ${job.name}`);
                    return { success: false, message: 'Unknown job type' };
            }
        } catch (error) {
            this.logger.error(`Payment job ${job.id} failed: ${error.message}`);
            throw error;
        }
    }

    private async processPayment(job: Job) {
        const { orderId, userId, amount, paymentMethod, paymentDetails } = job.data
        this.logger.log(`Processing payment for order ${orderId}: ${amount} via ${paymentMethod}`)
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate success/failure (90% success rate for demo)
        const isSuccess = Math.random() > 0.1;

        if (!isSuccess) {
            throw new Error('Payment provider returned error');
        }

        this.logger.log(`Payment successful for order ${orderId}`)

        return {
            success: true,
            orderId,
            transactionId: `txn_${Date.now()}`,
            amount,
            processedAt: new Date().toISOString(),
        }

    }
}
