import { CacheProvider } from "./CacheProvider";
import { Environment } from "roit-environment";
import { PlatformTools } from "../../platform/PlatformTools";
import { timeout as promiseTimeout } from "promise-timeout";

const REDIS_TIMEOUT =
    Environment.getProperty('firestore.cache.timeout') as unknown as number || 2000
const REDIS_RECONNECT: number =
    Environment.getProperty('firestore.cache.reconnectInSecondsAfterTimeout') as unknown as number || 30

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

            const isJest = typeof jest !== 'undefined'

            if (isJest) {
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

    private handleTimeoutError(error: Error) {
        if (error.message === 'Timeout' && this.isRedisReady) {
            console.log('Setting isRedisReady as false')
            this.isRedisReady = false;
            // Stop everything for a while to unburden Redis
            setTimeout(() => {
                console.log('Setting isRedisReady as true')
                this.isRedisReady = true;
            }, REDIS_RECONNECT * 1000)
        }
    }

    getKeys(query: string): Promise<string[]> {
        try {
            if (this.isRedisReady) {
                return promiseTimeout(this.client.KEYS(`*${query}*`), REDIS_TIMEOUT)
            }
        } catch (error) {
            this.handleTimeoutError(error)
            console.log(`[DEBUG] Redis Caching > Error when getting KEYS with query: ${query}, error: ${error}`)
        }
        return Promise.resolve([])
    }
    
    async getCacheResult(key: string): Promise<any | null> {
        try {
            if (this.isRedisReady) {
                const result: string = await promiseTimeout(this.client.get(key), REDIS_TIMEOUT)
        
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
        } catch (error) {
            this.handleTimeoutError(error)
            console.log(`[DEBUG] Redis Caching > Error when getting key from redis. ${key}`, { error })
            return null
        }
    }

    async saveCacheResult(key: string, valueToCache: any, ttl: number | undefined): Promise<void> {
        if (this.isRedisReady) {
            try {
                await promiseTimeout(this.client.set(key, JSON.stringify(valueToCache), {
                    EX: ttl || 0
                }), REDIS_TIMEOUT)     
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.debug('[DEBUG] Redis Caching >', `Storage cache from key: ${key}`)
                }
            } catch (error) {
                this.handleTimeoutError(error)                
                console.log(`[DEBUG] Redis Caching > Error when saving cache. Key: ${key}, value: ${valueToCache}, error: ${error}`)
            }            
        }
    }

    async delete(key: string): Promise<void> {
        try {
            if (this.isRedisReady) {
                await promiseTimeout(this.client.del(key), REDIS_TIMEOUT)
            }            
        } catch (error) {
            this.handleTimeoutError(error)
            console.log(`[DEBUG] Redis Caching > Error when deleting key from redis. ${key}`)
        }
    }

    private loadRedis(): any {
        try {
            return PlatformTools.load("redis")
        } catch (e) {
            throw new Error(
                `Cannot use cache because redis is not installed. Please run "npm i redis@4.0.6 --save-exact".`,
            )
        }
    }
}