import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class MySQLStore extends TypeOrmStore {
  static readonly scheme = 'mysql';

  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super(MySQLStore.scheme, { ...configuration, type: 'mysql' });
  }
}
