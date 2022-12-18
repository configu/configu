import { Config } from "./Config";

/**
 * An interface of a storage, aka ConfigStore
 * that contains Config records (Config[])
 */
export interface ConfigStore {
  type: string;
  // uid: string;
}

export type ConfigStoreQuery = {
  key: string;
  schema: string;
  set: string;
};


export interface ConfigStoreContentsElement extends Config {};
export type ConfigStoreContents = ConfigStoreContentsElement[];
