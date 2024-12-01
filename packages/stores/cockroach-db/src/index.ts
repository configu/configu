import { type CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions.js';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/database';

export type CockroachDBConfigStoreConfiguration = Omit<CockroachConnectionOptions, 'type'> &
  ORMConfigStoreSharedConfiguration;

export class CockroachDBConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super({ ...configuration, type: 'cockroachdb' });
  }
}
