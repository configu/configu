import { Config } from './Config';

export type ConfigStoreQuery = Pick<Config, "set" | "key">;

export interface ConfigStoreContentsElement extends Config {};
export type ConfigStoreContents = ConfigStoreContentsElement[];

/**
 * A storage engine interface for `Config`s records.
 * https://configu.com/docs/config-store/
 */
export interface ConfigStore {
  type: string;
}
