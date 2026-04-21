import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from 'ioredis'


@Injectable()
export class redisInventoryService {
    private readonly logger = new Logger(redisInventoryService.name)

    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
        private configService: ConfigService
    ) { }

    async getItem(key: string): Promise<string | null> {
        try {
            this.logger.log(`Checking redis for ${key}`)
            const value = await this.redis.get(key)
            if (value) this.logger.log('cache hit')
            return value
        } catch (error) {
            this.logger.error(`getItem error: ${error.message}`)
            return null
        }
    }

    async storeItem(key: string, value: string, ttl: number): Promise<void> {
        try {
            this.logger.log(`storing item in redis with key: ${key}`)
            await this.redis.set(key, value, 'EX', ttl)
        } catch (error) {
            this.logger.error(`storeItem error: ${error.message}`)
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            await this.redis.del(key)
            this.logger.log(`deleted key: ${key}`)
        } catch (error) {
            this.logger.error(`deleteItem error: ${error.message}`)
        }
    }

    async deleteByPattern(pattern: string): Promise<void> {
        try {
            const prefix = this.configService.get<string>('REDIS_KEY_PREFIX', '')
            const normalizedPrefix = prefix.endsWith(':') ? prefix : `${prefix}:`

            const fullPattern = `${normalizedPrefix}${pattern}*`
            this.logger.log(`Deleting keys matching: ${fullPattern}`)

            const keys = await this.redis.keys(fullPattern)
            this.logger.log(`Found ${keys.length} keys:`, keys)

            if (keys.length > 0) {
                // strip prefix before deleting —  redis client will re-add it
                const strippedKeys = keys.map(k => k.replace(`${normalizedPrefix}`, ''))
                this.logger.log('Stripped keys to delete:', strippedKeys)
                await this.redis.del(strippedKeys)
                this.logger.log(`Successfully deleted ${keys.length} keys`)
            }
        } catch (error) {
            this.logger.error(`deleteByPattern error: ${error.message}`)
        }
    }

    async debugListAllKeys(): Promise<string[]> {
        const keys = await this.redis.keys('*')
        this.logger.log('ALL REDIS KEYS:', keys)
        return keys
    }
}