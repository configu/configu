import { type SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions.js';

import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/database';

export type MsSQLConfigStoreConfiguration = Omit<SqlServerConnectionOptions, 'type'> &
  ORMConfigStoreSharedConfiguration;

export class MSSQLConfigStore extends ORMConfigStore {
  constructor(configuration: MsSQLConfigStoreConfiguration) {
    super({ ...configuration, type: 'mssql' });
  }
}
