import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class MSSQLStore extends TypeOrmStore {
  static readonly scheme = 'mssql';

  constructor(configuration: Omit<SqlServerConnectionOptions, 'type'>) {
    super(MSSQLStore.scheme, { ...configuration, type: 'mssql' });
  }
}
