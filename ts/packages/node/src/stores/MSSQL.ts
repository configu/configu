import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ORMConfigStore } from './ORM';

export class MSSQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<SqlServerConnectionOptions, 'type'>) {
    super('mssql', { ...configuration, type: 'mssql' });
  }
}
