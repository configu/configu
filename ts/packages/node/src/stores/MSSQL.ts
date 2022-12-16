import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ORMStore } from './ORM';

export class MSSQLStore extends ORMStore {
  constructor(configuration: Omit<SqlServerConnectionOptions, 'type'>) {
    super('mssql', { ...configuration, type: 'mssql' });
  }
}
