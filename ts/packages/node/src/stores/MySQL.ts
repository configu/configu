import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMStore } from './ORM';

export class MySQLStore extends ORMStore {
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super('mysql', { ...configuration, type: 'mysql' });
  }
}
