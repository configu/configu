import { AuroraMysqlConnectionOptions } from 'typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class AuroraMysqlStore extends TypeOrmStore {
  static readonly scheme = 'aurora-mysql';

  constructor(configuration: Omit<AuroraMysqlConnectionOptions, 'type'>) {
    super(AuroraMysqlStore.scheme, { ...configuration, type: 'aurora-mysql' });
  }
}
