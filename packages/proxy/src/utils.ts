import { ConfigStore } from '@configu/ts';
import { StoreType } from '@configu/lib';
import {
  AWSParameterStoreConfigStore,
  AWSSecretsManagerConfigStore,
  AzureKeyVaultConfigStore,
  CockroachDBConfigStore,
  ConfiguConfigStore,
  GCPSecretManagerConfigStore,
  HashiCorpVaultConfigStore,
  IniFileConfigStore,
  InMemoryConfigStore,
  JsonFileConfigStore,
  KubernetesSecretConfigStore,
  MariaDBConfigStore,
  MSSQLConfigStore,
  MySQLConfigStore,
  NoopConfigStore,
  PostgreSQLConfigStore,
  SQLiteConfigStore,
  LaunchDarklyConfigStore,
  CloudBeesConfigStore,
  CsvFileConfigStore,
  TomlFileConfigStore,
  XmlFileConfigStore,
  EtcdConfigStore,
} from '@configu/node';
import path from 'node:path';
import { cosmiconfigSync } from 'cosmiconfig';
import _ from 'lodash';
import { config } from './config';

// todo: change "any" here!
type ConfigStoreCtor = new (configuration: any) => ConfigStore;
const TYPE_TO_STORE_CTOR: Record<StoreType, ConfigStoreCtor> = {
  noop: NoopConfigStore,
  'in-memory': InMemoryConfigStore,
  configu: ConfiguConfigStore,
  'json-file': JsonFileConfigStore,
  'ini-file': IniFileConfigStore,
  'csv-file': CsvFileConfigStore,
  'toml-file': TomlFileConfigStore,
  'xml-file': XmlFileConfigStore,
  'hashicorp-vault': HashiCorpVaultConfigStore,
  'aws-parameter-store': AWSParameterStoreConfigStore,
  'aws-secrets-manager': AWSSecretsManagerConfigStore,
  'azure-key-vault': AzureKeyVaultConfigStore,
  'gcp-secret-manager': GCPSecretManagerConfigStore,
  'kubernetes-secret': KubernetesSecretConfigStore,
  sqlite: SQLiteConfigStore,
  mysql: MySQLConfigStore,
  mariadb: MariaDBConfigStore,
  postgres: PostgreSQLConfigStore,
  cockroachdb: CockroachDBConfigStore,
  mssql: MSSQLConfigStore,
  'launch-darkly': LaunchDarklyConfigStore,
  'cloud-bees': CloudBeesConfigStore,
  etcd: EtcdConfigStore,
};

const constructStore = (type: string, configuration: any): ConfigStore => {
  const StoreCtor = TYPE_TO_STORE_CTOR[type];
  if (!StoreCtor) {
    throw new Error(`unknown store type ${type}`);
  }
  return new StoreCtor(configuration);
};

type StoreConfigurationObject = { type: string; configuration: Record<string, unknown>; backup?: boolean };
export class ConfiguInterfaceConfiguration {
  private static configPath: string;
  private static config: Partial<{
    stores: Record<string, StoreConfigurationObject>;
    backup: string;
    schemas: Record<string, string>;
    scripts: Record<string, string>;
  }> = {};

  static {
    const explorerSync = cosmiconfigSync('configu');
    const result = explorerSync.load(config.CONFIGU_CONFIG_FILE);
    if (result === null || result.isEmpty) {
      throw new Error('.configu file not found');
    }
    if (_.isEmpty(result.config.stores)) {
      throw new Error('no stores defined in .configu file');
    }
    this.config = result.config;
    this.configPath = result.filepath;
  }

  static getStoreInstance(storeName?: string): ConfigStore {
    if (!storeName) {
      throw new Error('Store is required');
    }
    const storeConfig = this.config.stores?.[storeName];
    if (!storeConfig) {
      throw new Error(`Store "${storeName}" not found`);
    }
    return constructStore(storeConfig.type, storeConfig.configuration);
  }

  static getBackupStoreInstance(storeName?: string) {
    if (!storeName) {
      return undefined;
    }
    const shouldBackup = this.config.stores?.[storeName]?.backup;
    if (!shouldBackup) {
      return undefined;
    }
    const database = this.config.backup ?? path.join(path.dirname(this.configPath), 'config.backup.sqlite');
    return new SQLiteConfigStore({
      database,
      tableName: storeName,
    });
  }
}
