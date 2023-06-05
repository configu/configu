import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ORMConfigStore } from './ORM';

export class PostgreSQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super('postgres', { ...configuration, type: 'postgres' });
  }
}
