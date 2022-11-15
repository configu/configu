import { CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class CockroachStore extends TypeOrmStore {
  static readonly scheme = 'cockroachdb';

  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super(CockroachStore.scheme, { ...configuration, type: 'cockroachdb' });
  }
}
