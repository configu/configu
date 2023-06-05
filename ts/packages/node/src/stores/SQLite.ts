import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { ORMConfigStore } from './ORM';

export class SQLiteConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<SqliteConnectionOptions, 'type'>) {
    super('sqlite', { ...configuration, type: 'sqlite' });
  }
}
