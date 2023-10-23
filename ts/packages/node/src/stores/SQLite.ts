import { type SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { ORMConfigStore } from './ORM';

export type SQLiteConfigStoreConfiguration = Omit<SqliteConnectionOptions, 'type'>;

export class SQLiteConfigStore extends ORMConfigStore {
  constructor(configuration: SQLiteConfigStoreConfiguration) {
    super('sqlite', { ...configuration, type: 'sqlite' });
  }
}
