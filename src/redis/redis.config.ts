import { ConfigService } from '@nestjs/config';

export const redisConfig = (configService: ConfigService) => ({
  host: configService.get<string>('REDIS_HOST', 'localhost'),
  port: configService.get<number>('REDIS_PORT', 6379),
  password: configService.get<string>('REDIS_PASSWORD'),
  db: configService.get<number>('REDIS_DB', 0),
  keyPrefix: configService.get<string>('REDIS_KEY_PREFIX'),
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
  connectTimeout: 10000,
  // Max retries per request
  maxRetriesPerRequest: 3,
})
