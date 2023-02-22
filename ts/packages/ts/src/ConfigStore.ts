import { IConfigStore, ConfigStoreFeatures, ConfigStoreQuery, Config } from './types';
import { ERR } from './utils';

export abstract class ConfigStore implements IConfigStore {
  constructor(
    public readonly type: string,
    public readonly features: ConfigStoreFeatures = { readonly: false, inheritance: true },
  ) {}

  async init() {}
  abstract get(queries: ConfigStoreQuery[]): Promise<Config[]>;
  async set(configs: Config[]): Promise<void> {
    if (this.features.readonly === true) {
      throw new Error(ERR(`store ${this.constructor.name} is read-only`));
    }
  }
}
