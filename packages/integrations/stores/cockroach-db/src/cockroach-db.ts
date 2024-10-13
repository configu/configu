import { type CockroachConnectionOptions } from 'typeorm/driver/cockroachdb/CockroachConnectionOptions.js';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/integrations/src/utils/ORM';

export type CockroachDBConfigStoreConfiguration = Omit<CockroachConnectionOptions, 'type'> &
  ORMConfigStoreSharedConfiguration;

export class CockroachDBConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<CockroachConnectionOptions, 'type'>) {
    super('cockroachdb', { ...configuration, type: 'cockroachdb' });
  }
}
