import { type PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/integrations/src/utils/ORM';

export type PostgreSQLConfigStoreConfiguration = Omit<PostgresConnectionOptions, 'type'> &
  ORMConfigStoreSharedConfiguration;

export class PostgreSQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super({ ...configuration, type: 'postgres' });
  }
}
