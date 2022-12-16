import { Store } from '../Store';
import { StoreQuery, StoreContents } from '../types';

export class NoopStore extends Store {
  constructor() {
    super('noop');
  }

  async get(query: StoreQuery[]): Promise<StoreContents> {
    return [];
  }

  async set(configs: StoreContents): Promise<void> {}
}
