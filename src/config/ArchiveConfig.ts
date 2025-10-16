const FIRESTORE_PROJECT_ID =
    process.env.FIRESTORE_PROJECTID as unknown as string || ''
const FIRESTORE_ARCHIVE_DEBUG =
    process.env.FIRESTORE_ARCHIVE_DEBUG as unknown as boolean || false
const FIRESTORE_ARCHIVE_ENABLED =
    process.env.FIRESTORE_ARCHIVE_ENABLED as unknown as boolean || false
const FIRESTORE_ARCHIVE_BUCKET_NAME =
    process.env.FIRESTORE_ARCHIVE_BUCKET_NAME as unknown as string || "firestore-archive-roit"
const FIRESTORE_ARCHIVE_CACHE_ENABLED =
    process.env.FIRESTORE_ARCHIVE_CACHE_ENABLED as unknown as boolean || false
const FIRESTORE_ARCHIVE_CACHE_REDIS_URL =
    process.env.FIRESTORE_ARCHIVE_CACHE_REDISURL as unknown as string || ''
const FIRESTORE_ARCHIVE_CACHE_REDIS_TIMEOUT =
    process.env.FIRESTORE_ARCHIVE_CACHE_REDIS_TIMEOUT as unknown as number || 2000
const FIRESTORE_ARCHIVE_CACHE_REDIS_RECONNECT_IN_SECONDS_AFTER_TIMEOUT =
    process.env.FIRESTORE_ARCHIVE_CACHE_REDIS_RECONNECT_IN_SECONDS_AFTER_TIMEOUT as unknown as number || 30
const FIRESTORE_ARCHIVE_CACHE_EXPIRES_IN_SECONDS =
    process.env.FIRESTORE_ARCHIVE_CACHE_EXPIRESINSECONDS as unknown as number || 3600

export interface ArchiveConfig {
  enabled: boolean;
  bucketName: string;
  debug: boolean;
  projectId: string;
  cache: {
    enabled: boolean;
    redisUrl: string;
    timeout: number;
    reconnectInSecondsAfterTimeout: number;
    expiresInSeconds: number;
  }
}

export class ArchiveConfig {
  static getConfig(): ArchiveConfig {
    return {
      debug: ['true', true].includes(FIRESTORE_ARCHIVE_DEBUG),
      enabled: ['true', true].includes(FIRESTORE_ARCHIVE_ENABLED),
      bucketName: FIRESTORE_ARCHIVE_BUCKET_NAME,
      projectId: FIRESTORE_PROJECT_ID,
      cache: {
        enabled: ['true', true].includes(FIRESTORE_ARCHIVE_CACHE_ENABLED),
        redisUrl: FIRESTORE_ARCHIVE_CACHE_REDIS_URL,
        timeout: FIRESTORE_ARCHIVE_CACHE_REDIS_TIMEOUT,
        reconnectInSecondsAfterTimeout: FIRESTORE_ARCHIVE_CACHE_REDIS_RECONNECT_IN_SECONDS_AFTER_TIMEOUT,
        expiresInSeconds: FIRESTORE_ARCHIVE_CACHE_EXPIRES_IN_SECONDS
      }
    };
  }
}

export const DEBUG_PREFIX = '[ARCHIVE SERVICE]';
export const onDebugLog = (message: string) => {
  if (ArchiveConfig.getConfig().debug) {
    console.log(`${DEBUG_PREFIX} ${message}`);
  }
}

export const onDebugError = (message: string, error: any) => {
  if (ArchiveConfig.getConfig().debug) {
    console.error(`${DEBUG_PREFIX} ${message}`, error);
  }
}

export const onDebugWarn = (message: string) => {
  if (ArchiveConfig.getConfig().debug) {
    console.warn(`${DEBUG_PREFIX} ${message}`);
  }
}