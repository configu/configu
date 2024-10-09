import { type SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions.js';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/integrations/src/utils/ORM';

export type SQLiteConfigStoreConfiguration = Omit<SqliteConnectionOptions, 'type'> & ORMConfigStoreSharedConfiguration;

export class SQLiteConfigStore extends ORMConfigStore {
  constructor(configuration: SQLiteConfigStoreConfiguration) {
    super({ ...configuration, type: 'sqlite' });
  }
}
