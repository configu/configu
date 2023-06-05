import { CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions';
import { ORMConfigStore } from './ORM';

export class CockroachDBConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super('cockroachdb', { ...configuration, type: 'cockroachdb' });
  }
}
