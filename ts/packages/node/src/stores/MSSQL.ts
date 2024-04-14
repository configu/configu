import { type SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ORMConfigStore } from './ORM';

export type MSSQLConfigStoreConfiguration = Omit<SqlServerConnectionOptions, 'type'> & {
  tableName?: string;
};

export class MSSQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<SqlServerConnectionOptions, 'type'>) {
    super('mssql', { ...configuration, type: 'mssql' });
  }
}
