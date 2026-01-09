import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis){}

    async storeToken(token:string, userId:string, ttl:number){
        await this.redis.setex(`auth:token${token}`, ttl, userId)
    }

    async validateToken(token:string){
        return await this.redis.get(`auth:token${token}`)
    }

    async invalidateToken(token:string){
        console.log('deleting token from cache');        
        await this.redis.del(`auth:token${token}`)
    }
}
