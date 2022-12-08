import { AuroraMysqlConnectionOptions } from 'typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions';
import { ORMStore } from './ORM';

export class AuroraMysqlStore extends ORMStore {
  static readonly type = 'aurora-mysql';

  constructor(configuration: Omit<AuroraMysqlConnectionOptions, 'type'>) {
    super(AuroraMysqlStore.type, { ...configuration, type: 'aurora-mysql' });
  }
}
