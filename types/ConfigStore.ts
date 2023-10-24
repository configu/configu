import { Config } from './Config';

export type ConfigStoreQuery = Pick<Config, "set" | "key">;

export interface ConfigStoreContentsElement extends Config {};
export type ConfigStoreContents = ConfigStoreContentsElement[];

/**
 * An interface of a storage, aka ConfigStore
 * that I/Os Config records (Config[])
 */
export interface ConfigStore {
  type: string;
}
