import { AuroraPostgresConnectionOptions } from 'typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class AuroraPostgreSQLStore extends TypeOrmStore {
  static readonly scheme = 'aurora-postgres';

  constructor(configuration: Omit<AuroraPostgresConnectionOptions, 'type'>) {
    super(AuroraPostgreSQLStore.scheme, { ...configuration, type: 'aurora-postgres' });
  }
}
