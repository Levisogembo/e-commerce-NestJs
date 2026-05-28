import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as argon from 'argon2';
import { ref } from 'process';

@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }
    private logger = new Logger(RedisService.name)
    async storeToken(token: string, userId: string, ttl: number) {
        await this.redis.setex(`auth:token${token}`, ttl, userId)
    }

    async validateToken(token: string) {
        return await this.redis.get(`auth:token${token}`)
    }

    async invalidateToken(token: string) {
        console.log('deleting token from cache');
        await this.redis.del(`auth:token${token}`)
    }

    async storeRefreshToken(refreshToken: string, userId: string){
        const key = `auth:refresh:${userId}`
        const ttl = 60 * 60 * 24 * 30  // 30 days
        const hashed = await argon.hash(refreshToken)
        await this.redis.set(key, hashed, 'EX', ttl)
        this.logger.log(`Refresh token stored for user: ${userId}`)
    }

    async validateRefreshToken(refreshToken: string, userId: string) {
        const key = `auth:refresh:${userId}`
        const stored = await this.redis.get(key)
        if (!stored) return false
        return await argon.verify(stored, refreshToken)
    }

    async deleteRefreshToken(userId: string) {
        const key = `auth:refresh:${userId}`
        await this.redis.del(key)
        this.logger.log(`Refresh token deleted for user: ${userId}`)
    }
}
