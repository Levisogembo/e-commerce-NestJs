import { Inject, Injectable } from "@nestjs/common";
import { Redis } from 'ioredis'


@Injectable()
export class redisInventoryService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis){}

    async getItem(key:string) {
        console.log(`Checking redis for ${key}`);
        const item = await this.redis.get(key)
        item ? console.log('cache hit') : console.log('cache miss')
        return item   
    }

    async storeItem(key:string,value:string,ttl: number){
        console.log(`storing item in redis with key: ${key}`);
        await this.redis.setex(key,ttl,value)
    }

    async removeItem(key:string){
        console.log(`removing item in redis with key: ${key}`)
        await this.redis.del(key)
    }
}