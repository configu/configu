import { type CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from './ORM';

export type CockroachDBConfigStoreConfiguration = Omit<CockroachConnectionOptions, 'type'> &
  ORMConfigStoreSharedConfiguration;

export class CockroachDBConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super('cockroachdb', { ...configuration, type: 'cockroachdb' });
  }
}
