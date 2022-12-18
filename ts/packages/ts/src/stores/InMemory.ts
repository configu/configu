import _ from 'lodash';
import { ConfigStore } from '../ConfigStore';
import { ConfigStoreQuery, Config } from '../types';

export class InMemoryStore extends ConfigStore {
  private data: Config[] = [];

  constructor() {
    super('in-memory');
  }

  async get(query: ConfigStoreQuery[]): Promise<Config[]> {
    return this.data.filter((config) => {
      return query.some(({ set, schema, key }) => {
        return (
          (set === '*' || set === config.set) &&
          (schema === '*' || schema === config.schema) &&
          (key === '*' || key === config.key)
        );
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    this.data = _([...configs, ...this.data])
      .uniqBy((config) => `${config.set}.${config.schema}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();
  }
}
