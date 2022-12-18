import { CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions';
import { ORMStore } from './ORM';

export class CockroachDBStore extends ORMStore {
  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super('cockroachdb', { ...configuration, type: 'cockroachdb' });
  }
}
