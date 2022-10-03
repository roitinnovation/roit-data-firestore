import { CacheProvider } from "./CacheProvider";
import { createClient } from "redis";
import { Environment } from "roit-environment";
import { RedisClientType } from "@redis/client";

export class RedisCacheProvider implements CacheProvider {

    private redis: RedisClientType;

    constructor() {
        if (!this.redis) {
            const url = Environment.getProperty('firestore.cache.redisUrl')

            if (!url) {
                console.error(`[ERROR] Redis Caching > environtment variable "firestore.cache.redisUrl" was not found!`)
                return
            }

            this.redis = createClient({ url })

            this.redis.on('error', (err: any) => {
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.warn('[WARN] Redis error', err)
                }
            });

            this.redis.on('ready', () => {
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.log('[DEBUG] Redis Caching > Redis is ready')
                }
            })

            this.redis.connect()
        }
    }

    private isRedisReady() {
        return this.redis && this.redis.isReady
    }
    
    async getCacheResult(key: string): Promise<any | null> {
        try {
            if (this.isRedisReady()) {
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
            }            
        } catch (error) {
            return null
        }
    }

    async saveCacheResult(key: string, valueToCache: any, ttl: number | undefined): Promise<void> {
        if (this.isRedisReady()) {
            try {
                await this.redis.set(key, JSON.stringify(valueToCache), {
                    EX: ttl || 0
                })                
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.debug('[DEBUG] Caching >', `Storage cache from key: ${key}`)
                }
            } catch (error) {
                console.log(`[DEBUG] Redis Caching > Error when saving cache. Key: ${key}, value: ${valueToCache}, error: ${error}`)
            }            
        }
    }

    async delete(key: string): Promise<void> {
        try {
            if (this.isRedisReady()) {
                await this.redis.del(key)
            }            
        } catch (error) {
            console.log(`[DEBUG] Redis Caching > Error when deleting key from redis. ${key}`)
        }
    }
}