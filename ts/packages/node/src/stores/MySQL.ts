import { type MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from './ORM';

export type MySQLConfigStoreConfiguration = Omit<MysqlConnectionOptions, 'type'> & ORMConfigStoreSharedConfiguration;

export class MySQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super('mysql', { ...configuration, type: 'mysql' });
  }
}
