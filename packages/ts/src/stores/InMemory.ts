import _ from 'lodash';
import { ConfigStore } from '../ConfigStore';
import { type ConfigStoreQuery, type Config } from '../types';

export class InMemoryConfigStore extends ConfigStore {
  private data: Config[] = [];

  constructor() {
    super('in-memory');
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    return this.data.filter((config) => {
      return queries.some(({ set, key }) => {
        return set === config.set && key === config.key;
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    this.data = _([...configs, ...this.data])
      .uniqBy((config) => `${config.set}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();
  }
}
