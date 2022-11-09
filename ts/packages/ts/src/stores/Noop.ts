import { Store } from '../Store';
import { StoreQuery, StoreContents } from '../types';

export class NoopStore extends Store {
  static readonly scheme = 'noop';
  constructor() {
    super(NoopStore.scheme);
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    return [];
  }

  async set(configs: StoreContents): Promise<void> {}
}
