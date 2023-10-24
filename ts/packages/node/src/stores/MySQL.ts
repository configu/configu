import { type MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMConfigStore } from './ORM';

export type MySQLConfigStoreConfiguration = Omit<MysqlConnectionOptions, 'type'>;

export class MySQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super('mysql', { ...configuration, type: 'mysql' });
  }
}
