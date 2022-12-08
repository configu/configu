import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ORMStore } from './ORM';

export class MSSQLStore extends ORMStore {
  static readonly type = 'mssql';

  constructor(configuration: Omit<SqlServerConnectionOptions, 'type'>) {
    super(MSSQLStore.type, { ...configuration, type: 'mssql' });
  }
}
