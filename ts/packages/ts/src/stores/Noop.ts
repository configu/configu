import { ConfigStore } from '../ConfigStore';
import { ConfigStoreQuery, Config } from '../types';

export class NoopConfigStore extends ConfigStore {
  constructor() {
    super('noop');
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    return [];
  }

  async set(configs: Config[]): Promise<void> {}
}
