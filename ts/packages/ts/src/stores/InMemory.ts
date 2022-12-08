import _ from 'lodash';
import { Store } from '../Store';
import { StoreQuery, StoreContents } from '../types';

export class InMemoryStore extends Store {
  static readonly type = 'in-memory';
  private data: StoreContents = [];

  constructor() {
    super(InMemoryStore.type);
  }

  async get(query: StoreQuery[]): Promise<StoreContents> {
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

  async set(configs: StoreContents): Promise<void> {
    this.data = _([...configs, ...this.data])
      .uniqBy((config) => `${config.set}.${config.schema}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();
  }
}
