import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { ORMConfigStore } from './ORM';

export class MariaDBConfigStore extends ORMConfigStore {
  // * TypeORM uses the mysql driver under the hood for MariaDB
  constructor(configuration: Omit<MysqlConnectionOptions, 'type'>) {
    super('mariadb', { ...configuration, type: 'mariadb' });
  }
}
