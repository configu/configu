import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ORMStore } from './ORM';

export class PostgreSQLStore extends ORMStore {
  static readonly scheme = 'postgres';

  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super(PostgreSQLStore.scheme, { ...configuration, type: 'postgres' });
  }
}
