import { type ConfigStore } from '@configu/ts';
import { type StoreType } from '@configu/lib';
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
} from '@configu/node';

// todo: change "any" here!
type ConfigStoreCtor = new (configuration: any) => ConfigStore;
const TYPE_TO_STORE_CTOR: Record<StoreType, ConfigStoreCtor> = {
  noop: NoopConfigStore,
  'in-memory': InMemoryConfigStore,
  configu: ConfiguConfigStore,
  'json-file': JsonFileConfigStore,
  'ini-file': IniFileConfigStore,
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
};

export const constructStore = (type: string, configuration: any): ConfigStore => {
  const StoreCtor = TYPE_TO_STORE_CTOR[type];
  if (!StoreCtor) {
    throw new Error(`unknown store type ${type}`);
  }
  return new StoreCtor(configuration);
};
