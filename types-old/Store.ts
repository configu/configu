/**
 * A generic representation of a ConfigStore that contains Config records (Config[])
 */
export interface Store {
  scheme: string;
  uid: string;
}

export interface StoreQueryElement {
  key: string;
  schema: string;
  set: string;
}

export type StoreQuery = StoreQueryElement[];
