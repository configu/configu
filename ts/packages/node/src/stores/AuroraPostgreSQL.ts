import { AuroraPostgresConnectionOptions } from 'typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions';
import { ORMStore } from './ORM';

export class AuroraPostgreSQLStore extends ORMStore {
  static readonly scheme = 'aurora-postgres';

  constructor(configuration: Omit<AuroraPostgresConnectionOptions, 'type'>) {
    super(AuroraPostgreSQLStore.scheme, { ...configuration, type: 'aurora-postgres' });
  }
}
