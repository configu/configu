import { CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions';
import { ORMStore } from './ORM';

export class CockroachStore extends ORMStore {
  static readonly type = 'cockroachdb';

  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super(CockroachStore.type, { ...configuration, type: 'cockroachdb' });
  }
}
