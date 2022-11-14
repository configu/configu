import { AuroraMysqlConnectionOptions } from 'typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions';
import { TypeOrmStoreWithUpsert } from './TypeORM';

export class AuroraMysqlStore extends TypeOrmStoreWithUpsert {
  static readonly scheme = 'aurora-mysql';

  constructor(configuration: Omit<AuroraMysqlConnectionOptions, 'type'>) {
    super(AuroraMysqlStore.scheme, { ...configuration, type: 'aurora-mysql' });
  }
}
