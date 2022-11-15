import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class PostgresStore extends TypeOrmStore {
  static readonly scheme = 'postgres';

  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super(PostgresStore.scheme, { ...configuration, type: 'postgres' });
  }
}
