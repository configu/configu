import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { ORMStore } from './ORM';

export class SQLiteStore extends ORMStore {
  constructor(configuration: Omit<SqliteConnectionOptions, 'type'>) {
    super('sqlite', { ...configuration, type: 'sqlite' });
  }
}
