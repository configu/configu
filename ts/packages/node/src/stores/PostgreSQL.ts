import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class PostgreSQLStore extends TypeOrmStore {
  static readonly scheme = 'postgres';

  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super(PostgreSQLStore.scheme, { ...configuration, type: 'postgres' });
  }
}
