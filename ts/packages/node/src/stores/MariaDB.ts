import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMStore } from './ORM';

export class MariaStore extends ORMStore {
  static readonly scheme = 'mariadb';

  // * TypeORM uses the mysql driver under the hood for MariaDB
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super(MariaStore.scheme, { ...configuration, type: 'mariadb' });
  }
}
