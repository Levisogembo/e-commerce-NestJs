import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullMqRedisConfig } from './redis-connection.config';
import { QUEUES } from './Dtos/queues.constants';
import { QueuesService } from './queues.service';

@Global()
@Module({
    imports: [
        //configure bullmq connection to redis
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                connection: BullMqRedisConfig(configService),
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000
                    },
                    removeOnComplete: {
                        age: 3600, //remove completed jobs from the queue after an hour
                        count: 100 // retain last 100 successful jobs
                    },
                    removeOnFail: {
                        age: 24 * 3600, // retain failed jobs for a day
                        count: 500 // retain last 500 failed jobs
                    }
                }
            })
        }),

        //register queues to be used
        BullModule.registerQueue({
            name: QUEUES.ORDER,
            defaultJobOptions: {
                attempts: 5, //retry order 5 times
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                priority: 3
            }
        }),

        //register inventory queue
        BullModule.registerQueue({
            name: QUEUES.INVENTORY,
            defaultJobOptions: {
                attempts: 3,
                backoff: {type:'exponential', delay: 2000},
                priority: 2
            }
        }),

        BullModule.registerQueue({
            name: QUEUES.EMAIL,
            defaultJobOptions: {
              attempts: 3,
              backoff: { 
                type: 'fixed',                     // Fixed delay between retries
                delay: 5000                         // Wait 5 seconds between retries
              },
              removeOnComplete: {
                age: 600,                           // Remove email jobs after 10 minutes
                count: 1000,
              },
            },
          }),

        BullModule.registerQueue({
            name: QUEUES.PAYMENT,
            defaultJobOptions: {
                attempts: 5,
                backoff: {type:'exponential', delay: 2000},
                priority: 1
            }
        }),
    ],
    providers: [QueuesService]
})
export class QueuesModule {}
