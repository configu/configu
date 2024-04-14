import { type SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from './ORM';

export type MSSQLConfigStoreConfiguration = Omit<SqlServerConnectionOptions, 'type'> &
  ORMConfigStoreSharedConfiguration;

export class MSSQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<SqlServerConnectionOptions, 'type'>) {
    super('mssql', { ...configuration, type: 'mssql' });
  }
}
