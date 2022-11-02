import { Store } from '../Store';
import { StoreQuery, StoreContents } from '../types';

export class NoopStore extends Store {
  static readonly protocol = 'noop';
  constructor() {
    super(NoopStore.protocol, { supportsGlobQuery: true, enforceRootSet: false, slashDisallowedOnKey: false });
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    return [];
  }

  async set(configs: StoreContents): Promise<void> {}
}
