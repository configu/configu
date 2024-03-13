import { type IConfigStore, type ConfigStoreQuery, type Config } from './types';

export abstract class ConfigStore implements IConfigStore {
  constructor(public readonly type: string) {}

  async init() {}
  abstract get(queries: ConfigStoreQuery[]): Promise<Config[]>;
  abstract set(configs: Config[]): Promise<void>;
}
