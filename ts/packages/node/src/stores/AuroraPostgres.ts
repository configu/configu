import { AuroraPostgresConnectionOptions } from 'typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class AuroraPostgresStore extends TypeOrmStore {
  static readonly scheme = 'aurora-postgres';

  constructor(configuration: Omit<AuroraPostgresConnectionOptions, 'type'>) {
    super(AuroraPostgresStore.scheme, { ...configuration, type: 'aurora-postgres' });
  }
}
