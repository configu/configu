import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class MariaStore extends TypeOrmStore {
  static readonly scheme = 'sqlite';

  // * TypeORM uses the mysql driver under the hood for MariaDB
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super(MariaStore.scheme, { ...configuration, type: 'mariadb' });
  }
}
