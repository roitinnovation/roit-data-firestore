import { Environment } from "roit-environment";

export interface ArchiveConfig {
  enabled: boolean;
  bucketName?: string;
  cacheArchivedData: boolean;
}

export class ArchiveConfig {
  static getConfig(): ArchiveConfig {
    return {
      enabled: ['true', true].includes(Environment.getProperty('archive.enabled')),
      bucketName: Environment.getProperty('archive.bucket_name'),
      cacheArchivedData: ['true', true].includes(Environment.getProperty('archive.cache_data'))
    };
  }
}