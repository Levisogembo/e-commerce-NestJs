import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { JOB_NAMES, QUEUES } from './Dtos/queues.constants';
import { Queue } from 'bullmq';
import { orderJobData } from './Dtos/orders.interface';

@Injectable()
export class QueuesService {
    private readonly logger = new Logger(QueuesService.name)

    constructor(@InjectQueue(QUEUES.ORDER) private orderQueue: Queue,
        @InjectQueue(QUEUES.INVENTORY) private inventoryQueue: Queue,
        @InjectQueue(QUEUES.PAYMENT) private paymentQueue: Queue,
        @InjectQueue(QUEUES.EMAIL) private emailQueue: Queue
    ) { this.logger.log('Bull Queue service initialized')}

    //process orders in the queue after they are created
    async addOrderJob(data: orderJobData){
        this.logger.log(`adding order job for : ${data.orderId}`)

        try{
            const job = await this.orderQueue.add(JOB_NAMES.PROCESS_ORDER,data,{
                jobId: `order:${data.orderId}`,
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
        }catch(err){
            this.logger.log(`There was an error adding job: ${err.message}`, err.stack)
            throw err
        }
    }
}
