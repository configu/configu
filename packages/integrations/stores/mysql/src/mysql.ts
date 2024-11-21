import { type MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/integrations/src/utils/ORM';

export type MySQLConfigStoreConfiguration = Omit<MysqlConnectionOptions, 'type'> & ORMConfigStoreSharedConfiguration;

export class MySQLConfigStore extends ORMConfigStore {
  constructor(configuration: MySQLConfigStoreConfiguration) {
    super({ ...configuration, type: 'mysql' });
  }
}
