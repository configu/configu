import { type MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/database';

// * TypeORM uses the mysql driver under the hood for MariaDB
export type MariaDBConfigStoreConfiguration = Omit<MysqlConnectionOptions, 'type'> & ORMConfigStoreSharedConfiguration;

export class MariaDBConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super({ ...configuration, type: 'mariadb' });
  }
}
