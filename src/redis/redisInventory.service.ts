import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from 'ioredis'


@Injectable()
export class redisInventoryService {
    private readonly prefix: string
    private logger = new Logger(redisInventoryService.name)

    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis, private configService: ConfigService) {
        const rawPrefix = this.configService.get<string>("REDIS_KEY_PREFIX","")
        this.prefix = rawPrefix.endsWith(':') ? rawPrefix : `${rawPrefix}:`
     }

     private buildKey (key:string) {
        return `${this.prefix}${key}`
     }

    async getItem(key: string) {
        this.logger.log(`Checking redis for ${this.buildKey(key)}`);
        // const allKeys = await this.redis.keys('*');
        // console.log('ALL KEYS:', allKeys);
        const item = await this.redis.get(this.buildKey(key))
        item ? console.log('cache hit') : console.log('cache miss')
        return item
    }

    async storeItem(key: string, value: string, ttl: number) {
        this.logger.log(`storing item in redis with key: ${this.buildKey(key)}`);
        await this.redis.setex(this.buildKey(key), ttl, value)
    }

    async removeItem(key: string) {
        this.logger.log(`removing item in redis with key: ${this.buildKey(key)}`)
        await this.redis.del(this.buildKey(key))
    }

    //delete paginated cache keys
    async deleteByPattern(pattern: string) {
        
        const fullPattern = `${this.prefix}${pattern}`
        this.logger.log('Deleting keys:', fullPattern);
        const keys = await this.redis.keys(fullPattern)
        this.logger.log(`Deleted ${keys.length} keys:`, keys);
        if (keys.length > 0) await this.redis.del(...keys)
    }
}