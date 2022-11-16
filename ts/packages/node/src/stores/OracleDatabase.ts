import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import { TypeOrmStore } from './TypeORM';

export class OracleDatabaseStore extends TypeOrmStore {
  static readonly scheme = 'oracle-database';

  constructor(configuration: Omit<OracleConnectionOptions, 'type'>) {
    super(OracleDatabaseStore.scheme, { ...configuration, type: 'oracle' });
  }
}
