import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class MysqlStore extends TypeOrmStore {
  static readonly scheme = 'mysql';

  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super(MysqlStore.scheme, { ...configuration, type: 'mysql' });
  }
}
