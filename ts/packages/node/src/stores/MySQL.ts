import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMConfigStore } from './ORM';

export class MySQLConfigStore extends ORMConfigStore {
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super('mysql', { ...configuration, type: 'mysql' });
  }
}
