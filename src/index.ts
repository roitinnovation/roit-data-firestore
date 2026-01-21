import 'reflect-metadata'

/**
 * decorators
 */
export { Repository } from "./decorators/Repository"
export { Query } from "./decorators/Query"
export { Cacheable } from "./decorators/Cacheable"

/**
 * config
 */
export { BaseRepository } from "./config/BaseRepository"
export { ReadonlyRepository } from "./config/ReadonlyRepository"
export { GenericRepository } from "./config/GenericRepository"
export { ArchiveConfig } from "./config/ArchiveConfig"

export { CacheProviders } from "./model/CacheProviders"

export { FirestoreInstance } from "./config/FirestoreInstance"

/**
 * archive plugin system
 */
export {
  IArchivePlugin,
  registerArchivePlugin,
  getArchivePlugin,
  hasArchivePlugin,
  resetArchivePlugin,
} from "./archive"

export * from "./model"