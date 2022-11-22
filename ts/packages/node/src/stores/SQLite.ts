import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { ORMStore } from './ORM';

export class SQLiteStore extends ORMStore {
  static readonly scheme = 'sqlite';

  constructor(configuration: Omit<SqliteConnectionOptions, 'type'>) {
    super(SQLiteStore.scheme, { ...configuration, type: 'sqlite' });
  }
}
