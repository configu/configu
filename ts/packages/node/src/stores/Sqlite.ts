import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class SqliteStore extends TypeOrmStore {
  static readonly scheme = 'sqlite';

  constructor(configuration: Omit<SqliteConnectionOptions, 'type'>) {
    super(SqliteStore.scheme, { ...configuration, type: 'sqlite' });
  }
}
