import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMStore } from './ORM';

export class MySQLStore extends ORMStore {
  static readonly scheme = 'mysql';

  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super(MySQLStore.scheme, { ...configuration, type: 'mysql' });
  }
}
