import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ORMStore } from './ORM';

export class MSSQLStore extends ORMStore {
  static readonly scheme = 'mssql';

  constructor(configuration: Omit<SqlServerConnectionOptions, 'type'>) {
    super(MSSQLStore.scheme, { ...configuration, type: 'mssql' });
  }
}
