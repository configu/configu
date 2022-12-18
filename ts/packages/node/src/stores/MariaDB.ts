import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMStore } from './ORM';

export class MariaDBStore extends ORMStore {
  // * TypeORM uses the mysql driver under the hood for MariaDB
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super('mariadb', { ...configuration, type: 'mariadb' });
  }
}
