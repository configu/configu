import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ORMStore } from './ORM';

export class PostgreSQLStore extends ORMStore {
  constructor(configuration: Omit<PostgresConnectionOptions, 'type'>) {
    super('postgres', { ...configuration, type: 'postgres' });
  }
}
