import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ORMStore } from './ORM';

export class PostgreSQLStore extends ORMStore {
  static readonly type = 'postgres';

  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super(PostgreSQLStore.type, { ...configuration, type: 'postgres' });
  }
}
