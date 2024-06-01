import { ConfigStore } from '../ConfigStore';
import { type ConfigStoreQuery, type Config } from '../types';

export class NoopConfigStore extends ConfigStore {
  constructor() {
    super('noop');
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    return [];
  }

  async set(configs: Config[]): Promise<void> {}
}
