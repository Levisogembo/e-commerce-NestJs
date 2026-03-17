import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { JOB_NAMES, QUEUES } from './Dtos/queues.constants';
import { Queue } from 'bullmq';
import { emailJobData, inventoryJobData, orderJobData, paymentJobData } from './Dtos/queues.interface';

//to be considered for future improvement
/*
Job Events - So you know when jobs complete/fail

Dead Letter Queue - Handle failed orders properly

Scheduled Jobs - For order timeouts (e.g., cancel if not paid)

Monitoring Dashboard - See what's happening in queues

Rate Limiting - Prevent overload during sales 
*/

@Injectable()
export class QueuesService {
    private readonly logger = new Logger(QueuesService.name)

    constructor(@InjectQueue(QUEUES.ORDER) private orderQueue: Queue,
        @InjectQueue(QUEUES.INVENTORY) private inventoryQueue: Queue,
        @InjectQueue(QUEUES.PAYMENT) private paymentQueue: Queue,
        @InjectQueue(QUEUES.EMAIL) private emailQueue: Queue
    ) { this.logger.log('Bull Queue service initialized') }

    //process orders in the queue after they are created
    async addOrderJob(data: orderJobData) {
        this.logger.log(`adding order job for : ${data.orderId}`)

        try {
            const job = await this.orderQueue.add(JOB_NAMES.PROCESS_ORDER, data, {
                jobId: `order-${data.orderId}`,
                delay: 0,
                priority: 2,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                timestamp: Date.now()
            })
            this.logger.log(`Order Job created with Id: ${job.id}`)
            return {
                jobId: job.id,
                orderId: data.orderId
            }
        } catch (err) {
            this.logger.error(`There was an error adding job: ${err.message}`, err.stack)
            throw err
        }
    }

    //processing payments
    async addPaymentJob(data: paymentJobData) {
        this.logger.log(`processing payments for order: ${data.orderId}`)
        try {
            const job = await this.paymentQueue.add(JOB_NAMES.PROCESS_PAYMENT, data, {
                jobId: `payment-${data.orderId}`,
                priority: 1,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 3000
                }
            })
            this.logger.log(`payment job created ${job.id}`)
            return {
                jobId: job.id,
                orderId: data.orderId
            }
        } catch (error) {
            this.logger.error(`Failed to add payment job: ${error.message}`);
            throw error;
        }
    }

    //processing inventory
    async addInventoryJob(data: inventoryJobData) {
        this.logger.log(`Adding inventory to the queue ${data.orderId}`)
        try {
            const job = await this.inventoryQueue.add(JOB_NAMES.UPDATE_INVENTORY, data, {
                jobId: `inventory-${data.orderId}:${data.action}`,
                priority: 2,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            })
            this.logger.log(`Job added successfully ${job.id}`)
            return job.id
        } catch (error) {
            this.logger.error(`Failed to add inventory job: ${error.message}`);
            throw error;
        }
    }

    //process emails
    async addEmailJobData(data: emailJobData) {
        this.logger.log(`Adding email job to: ${data.to}`)
        try {
            const job = await this.emailQueue.add(JOB_NAMES.SEND_CONFIRMATION_EMAIL, data, {
                priority: 4,
                attempts: 3,
                backoff: { type: 'fixed', delay: 5000 },
                removeOnComplete: true
            })
            return job.id
        } catch (error) {
            this.logger.error(`Failed to add email job: ${error.message}`);
            return null;
        }
    }

    //utilities
    //schedule a delayed job
    async scheduleDelayedJob(
        queueName: string,
        jobName: string,
        data: any,
        delayInMinutes: number,
    ): Promise<string> {
        this.logger.log(`Scheduling ${jobName} in ${delayInMinutes} minutes`);

        const queue = this.getQueue(queueName);

        const job = await queue.add(jobName, data, {
            delay: delayInMinutes * 60 * 1000,
            attempts: 1,
            jobId: `${jobName}:${data.orderId}:${Date.now()}`,
        });

        return job.id as string;
    }

    async getJobStatus(queueName: string, jobId: string): Promise<any> {
        const queue = this.getQueue(queueName);

        try {
            const job = await queue.getJob(jobId);

            if (!job) {
                return { status: 'not-found', jobId };
            }

            const state = await job.getState();

            return {
                id: job.id,
                name: job.name,
                state,
                attempts: job.attemptsMade,
                failedReason: job.failedReason,
                timestamp: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
            };
        } catch (error) {
            this.logger.error(`Error getting job status: ${error.message}`);
            throw error;
        }
    }

    private getQueue(name: string): Queue {
        const queues = {
            [QUEUES.ORDER]: this.orderQueue,
            [QUEUES.EMAIL]: this.emailQueue,
            [QUEUES.INVENTORY]: this.inventoryQueue,
            [QUEUES.PAYMENT]: this.paymentQueue,
        };

        const queue = queues[name];
        if (!queue) {
            throw new Error(`Queue ${name} not found`);
        }

        return queue;
    }
}
