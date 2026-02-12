import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { redisConfig } from './redis.config';
import {Redis} from 'ioredis'
import { error } from 'console';
import { redisInventoryService } from './redisInventory.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService:ConfigService) => {
        const config =  redisConfig(configService)
        //creating the redis client
        const redisClient = new Redis(config)

        redisClient.on('connect',()=>console.log('Redis server connected successfully'))
        redisClient.on('error',()=>console.log(`Redis connection error: ${error}`))
        redisClient.on('close',()=>console.log('Redis servicer closed'))
        return redisClient
      }
    },
    RedisService, redisInventoryService
  ],
  exports:['REDIS_CLIENT',RedisService, redisInventoryService]
})
export class RedisModule {}
