import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMStore } from './ORM';

export class MySQLStore extends ORMStore {
  static readonly type = 'mysql';

  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super(MySQLStore.type, { ...configuration, type: 'mysql' });
  }
}
