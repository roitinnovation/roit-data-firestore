import { CacheProvider } from "./CacheProvider";
import { Environment } from "roit-environment";
import { PlatformTools } from "../../platform/PlatformTools";

export class RedisCacheProvider implements CacheProvider {

    /**
     * Redis module instance loaded dynamically.
     */
    private redis: any

    /**
     * Connected redis client.
     */
    private client: any

    private isRedisReady = false;

    constructor() {
        if (!this.redis) {
            const url = Environment.getProperty('firestore.cache.redisUrl')

            if (!url) {
                console.error(`[ERROR] Redis Caching > environtment variable "firestore.cache.redisUrl" was not found!`)
                return
            }

            this.redis = this.loadRedis()

            this.client = this.redis.createClient({ url })

            this.client.on('error', (err: any) => {
                this.isRedisReady = false
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.warn('[WARN] Redis error', err)
                }
            });

            this.client.on('ready', () => {
                this.isRedisReady = true
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.log('[DEBUG] Redis Caching > Redis is ready')
                }
            })

            this.client.connect()
        }
    }
    
    async getCacheResult(key: string): Promise<any | null> {
        try {
            if (this.isRedisReady) {
                const result = await this.client.get(key)
        
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
        if (this.isRedisReady) {
            try {
                await this.client.set(key, JSON.stringify(valueToCache), {
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
            if (this.isRedisReady) {
                await this.client.del(key)
            }            
        } catch (error) {
            console.log(`[DEBUG] Redis Caching > Error when deleting key from redis. ${key}`)
        }
    }

    protected loadRedis(): any {
        try {
            return PlatformTools.load("redis")
        } catch (e) {
            throw new Error(
                `Cannot use cache because redis is not installed. Please run "npm i redis@4.0.6 --save-exact".`,
            )
        }
    }
}