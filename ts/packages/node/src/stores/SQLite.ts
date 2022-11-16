import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class SQLiteStore extends TypeOrmStore {
  static readonly scheme = 'sqlite';

  constructor(configuration: Omit<SqliteConnectionOptions, 'type'>) {
    super(SQLiteStore.scheme, { ...configuration, type: 'sqlite' });
  }
}
