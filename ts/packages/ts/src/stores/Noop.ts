import { ConfigStore } from '../ConfigStore';
import { ConfigStoreQuery, Config } from '../types';

export class NoopStore extends ConfigStore {
  constructor() {
    super('noop');
  }

  async get(query: ConfigStoreQuery[]): Promise<Config[]> {
    return [];
  }

  async set(configs: Config[]): Promise<void> {}
}
