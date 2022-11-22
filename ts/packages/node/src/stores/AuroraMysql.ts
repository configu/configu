import { AuroraMysqlConnectionOptions } from 'typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions';
import { ORMStore } from './ORM';

export class AuroraMysqlStore extends ORMStore {
  static readonly scheme = 'aurora-mysql';

  constructor(configuration: Omit<AuroraMysqlConnectionOptions, 'type'>) {
    super(AuroraMysqlStore.scheme, { ...configuration, type: 'aurora-mysql' });
  }
}
