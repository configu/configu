import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { TypeOrmStoreWithUpsert } from './TypeORM';

export class MysqlStore extends TypeOrmStoreWithUpsert {
  static readonly scheme = 'mysql';

  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super(MysqlStore.scheme, { ...configuration, type: 'mysql' });
  }
}
