import { ConfigService } from "@nestjs/config";


export const BullMqRedisConfig = (configService: ConfigService) => ({
    host: configService.get<string>("REDIS_HOST", 'localhost'),
    port: configService.get<number>("REDIS_PORT", 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: configService.get<number>('REDIS_DB', 0),
    keyPrefix: 'bull:',

    maxRetriesPerRequest: null,
    enableReadyCheck: false,

    connectTimeout: 10000,
    disconnectTimeout: 5000,

    // Retry strategy
    retryStrategy: (times: number) => {
        return Math.min(times * 100, 3000);
    },
})