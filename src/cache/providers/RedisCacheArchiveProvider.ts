import { CacheProvider } from "./CacheProvider";
import { PlatformTools } from "../../platform/PlatformTools";
import { timeout as promiseTimeout } from "promise-timeout";
import { ArchiveConfig, onDebugLog, onDebugWarn, DEBUG_PREFIX } from "../../config/ArchiveConfig";

const REDIS_TIMEOUT = ArchiveConfig.getConfig().cache.timeout
const REDIS_RECONNECT: number = ArchiveConfig.getConfig().cache.reconnectInSecondsAfterTimeout
const REDIS_ENABLED = ArchiveConfig.getConfig().cache.enabled

export class RedisCacheArchiveProvider implements CacheProvider {

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

        onDebugLog(`Redis Caching Firestore Archive > Redis is enabled ${REDIS_ENABLED}`);

        if (!this.redis && REDIS_ENABLED) {
            const url = ArchiveConfig.getConfig().cache.redisUrl

            if (!url) {
                console.error(`${DEBUG_PREFIX} [ERROR] Redis Caching > environtment variable "firestore.archive.cache.redisUrl" was not found!`)
                return
            }

            if (process.env.JEST_WORKER_ID !== undefined) {
                return
            }

            this.redis = this.loadRedis()

            this.client = this.redis.createClient({ url })

            this.client.on('error', (err: any) => {
                this.isRedisReady = false
                onDebugWarn(`Redis error: ${err}`);
            });

            this.client.on('ready', () => {
                this.isRedisReady = true
                onDebugLog('Redis Caching Archive > Redis is ready');
            })

            this.client.connect()
        }
    }

    private handleTimeoutError(error: Error) {
        if (error.message === 'Timeout' && this.isRedisReady) {
            onDebugLog('Setting isRedisReady as false');
            this.isRedisReady = false;
            // Stop everything for a while to unburden Redis
            setTimeout(() => {
                onDebugLog('Setting isRedisReady as true');
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
            console.log(`${DEBUG_PREFIX} Redis Caching > Error when getting KEYS with query: ${query}, error: ${error}`)
        }
        return Promise.resolve([])
    }
    
    async getCacheResult(key: string): Promise<any | null> {
        try {
            if (this.isRedisReady) {
                const result: string = await promiseTimeout(this.client.get(key), REDIS_TIMEOUT)
        
                if (result) {
                    onDebugLog(`Redis Caching > Return value in cache from key: ${key}`);
                } else {
                    onDebugLog(`Redis Caching > Key [${key}] is not found in the cache`);
                }
        
                if (result) {
                    return JSON.parse(result)
                }

                return null
            }            
        } catch (error) {
            this.handleTimeoutError(error)
            console.log(`${DEBUG_PREFIX} Redis Caching > Error when getting key from redis. ${key}`, { error })
            return null
        }
    }

    async saveCacheResult(key: string, valueToCache: any, ttl: number | undefined): Promise<void> {
        if (this.isRedisReady) {
            try {
                await promiseTimeout(this.client.set(key, JSON.stringify(valueToCache), {
                    EX: ttl || ArchiveConfig.getConfig().cache.expiresInSeconds
                }), REDIS_TIMEOUT)     
                onDebugLog(`Redis Caching > Storage cache from key: ${key}`);
            } catch (error) {
                this.handleTimeoutError(error)                
                console.log(`${DEBUG_PREFIX} Redis Caching > Error when saving cache. Key: ${key}, value: ${valueToCache}, error: ${error}`)
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
            console.log(`${DEBUG_PREFIX} Redis Caching > Error when deleting key from redis. ${key}`)
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