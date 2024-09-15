import { type SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from './utils/ORM';

export type SQLiteConfigStoreConfiguration = Omit<SqliteConnectionOptions, 'type'> & ORMConfigStoreSharedConfiguration;

export class SQLiteConfigStore extends ORMConfigStore {
  constructor(configuration: SQLiteConfigStoreConfiguration) {
    super('sqlite', { ...configuration, type: 'sqlite' });
  }
}
