import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { ORMStore } from './ORM';

export class SQLiteStore extends ORMStore {
  static readonly type = 'sqlite';

  constructor(configuration: Omit<SqliteConnectionOptions, 'type'>) {
    super(SQLiteStore.type, { ...configuration, type: 'sqlite' });
  }
}
