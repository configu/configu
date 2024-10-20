import { type PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from './ORM';

export type PostgreSQLConfigStoreConfiguration = Omit<PostgresConnectionOptions, 'type'> &
  ORMConfigStoreSharedConfiguration;

export class PostgreSQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super('postgres', { ...configuration, type: 'postgres' });
  }
}
