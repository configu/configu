import { CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions';
import { ORMStore } from './ORM';

export class CockroachStore extends ORMStore {
  static readonly scheme = 'cockroachdb';

  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super(CockroachStore.scheme, { ...configuration, type: 'cockroachdb' });
  }
}
