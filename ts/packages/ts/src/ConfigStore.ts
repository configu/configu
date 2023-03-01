import { IConfigStore, ConfigStoreQuery, Config } from './types';

export abstract class ConfigStore implements IConfigStore {
  constructor(public readonly type: string) {}

  async init() {}
  abstract get(queries: ConfigStoreQuery[]): Promise<Config[]>;
  abstract set(configs: Config[]): Promise<void>;
}
