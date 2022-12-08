import { AuroraPostgresConnectionOptions } from 'typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions';
import { ORMStore } from './ORM';

export class AuroraPostgreSQLStore extends ORMStore {
  static readonly type = 'aurora-postgres';

  constructor(configuration: Omit<AuroraPostgresConnectionOptions, 'type'>) {
    super(AuroraPostgreSQLStore.type, { ...configuration, type: 'aurora-postgres' });
  }
}
