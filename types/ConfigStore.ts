import { type Config } from './Config';

/**
 * An interface of a storage, aka ConfigStore
 * that I/Os Config records (Config[])
 */
export interface ConfigStore {
  type: string;
}

export type ConfigStoreQuery = Pick<Config, "set" | "key">;

export interface ConfigStoreContentsElement extends Config {};
export type ConfigStoreContents = ConfigStoreContentsElement[];
