import { Implementation } from "villar";
import { CacheProviders } from "../../model/CacheProviders";
import { CacheProvider } from "./CacheProvider";
import { createClient } from "redis";
import { Environment } from "roit-environment";
import { RedisClientType } from "@redis/client";

@Implementation({
    key: CacheProviders.REDIS
})
export class RedisCacheProvider implements CacheProvider {

    private redis: RedisClientType;

    constructor() {}

    private async checkRedisConnection() {
        if (!this.redis) {
            const url = Environment.getProperty('firestore.cache.redisUrl')
            if (!url) {
                console.error(`[ERROR] Redis Caching > environtment variable "firestore.cache.redisUrl" was not found!`)
            }
    
            this.redis = createClient({ url })
            this.redis.on('error', (err: any) => {
                console.log('Redis Client Error', err)
                this.redis.quit()
            });
            this.redis.on('ready', () => {
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.log('[DEBUG] Redis Caching > Redis is ready')
                }
            })
            await this.redis.connect()
        }
    }
    
    async getCacheResult(key: string): Promise<string | null> {
        await this.checkRedisConnection()

        const result = await this.redis.get(key)

        if (Boolean(Environment.getProperty('firestore.debug'))) {
            if (result) {
                console.debug('[DEBUG] Redis Caching >', `Return value in cache from key: ${key}`)
            } else {
                console.log("[DEBUG] Redis Caching > ", `Key [${key}] is not found in the cache`)
            }
        }

        if (result) {
            return JSON.parse(result)
        }

        return null
    }

    async saveCacheResult(key: string, valueToCache: any, ttl: number | undefined): Promise<void> {
        await this.checkRedisConnection()

        await this.redis.set(key, JSON.stringify(valueToCache), {
            EX: ttl || 0
        })
    }
}