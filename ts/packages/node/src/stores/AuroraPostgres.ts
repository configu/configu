import { AuroraPostgresConnectionOptions } from 'typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions';
import { TypeOrmStoreWithUpsert } from './TypeORM';

export class AuroraPostgresStore extends TypeOrmStoreWithUpsert {
  static readonly scheme = 'aurora-postgres';

  constructor(configuration: Omit<AuroraPostgresConnectionOptions, 'type'>) {
    super(AuroraPostgresStore.scheme, { ...configuration, type: 'aurora-postgres' });
  }
}
