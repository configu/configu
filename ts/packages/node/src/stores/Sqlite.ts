import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { TypeOrmStoreWithUpsert } from './TypeORM';

export class SqliteStore extends TypeOrmStoreWithUpsert {
  static readonly scheme = 'sqlite';

  constructor(configuration: Omit<SqliteConnectionOptions, 'type'>) {
    super(SqliteStore.scheme, { ...configuration, type: 'sqlite' });
  }
}
