import { Config } from "./Config";

/**
 * A generic representation of a ConfigStore that contains Config records (Config[])
 */
export interface Store {
  type: string;
  uid: string;
}

export type StoreQueryElement = {
  key: string;
  schema: string;
  set: string;
}
export type StoreQuery = StoreQueryElement[];


export interface StoreContentsElement extends Config {};
export type StoreContents = StoreContentsElement[];
