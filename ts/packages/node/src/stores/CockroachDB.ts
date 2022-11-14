import { CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions';
import { TypeOrmStoreWithUpsert } from './TypeORM';

export class CockroachStore extends TypeOrmStoreWithUpsert {
  static readonly scheme = 'cockroachdb';

  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super(CockroachStore.scheme, { ...configuration, type: 'cockroachdb' });
  }
}
