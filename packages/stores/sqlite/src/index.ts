import { type SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions.js';
import sqlite3 from 'sqlite3';
import { ORMConfigStore, type ORMConfigStoreSharedConfiguration } from '@configu/database';

export type SQLiteConfigStoreConfiguration = Omit<SqliteConnectionOptions, 'type'> & ORMConfigStoreSharedConfiguration;

export class SQLiteConfigStore extends ORMConfigStore {
  constructor(configuration: SQLiteConfigStoreConfiguration) {
    super({ ...configuration, type: 'sqlite', driver: sqlite3 });
  }
}
