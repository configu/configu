import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { TypeOrmStoreWithUpsert } from './TypeORM';

export class PostgresStore extends TypeOrmStoreWithUpsert {
  static readonly scheme = 'postgres';

  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super(PostgresStore.scheme, { ...configuration, type: 'postgres' });
  }
}
