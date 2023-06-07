import { ConfigStore } from '@configu/ts';
import { StoreType } from '@configu/lib';
import {
  NoopConfigStore,
  InMemoryConfigStore,
  ConfiguConfigStore,
  AWSSecretsManagerConfigStore,
  AzureKeyVaultConfigStore,
  CockroachDBConfigStore,
  GCPSecretManagerConfigStore,
  HashiCorpVaultConfigStore,
  JsonFileConfigStore,
  KubernetesSecretConfigStore,
  MariaDBConfigStore,
  MSSQLConfigStore,
  MySQLConfigStore,
  PostgreSQLConfigStore,
  SQLiteConfigStore,
} from '@configu/node';

// todo: change "any" here!
type ConfigStoreCtor = new (configuration: any) => ConfigStore;
const TYPE_TO_STORE_CTOR: Record<StoreType, ConfigStoreCtor> = {
  noop: NoopConfigStore,
  'in-memory': InMemoryConfigStore,
  configu: ConfiguConfigStore,
  'json-file': JsonFileConfigStore,
  'hashicorp-vault': HashiCorpVaultConfigStore,
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
};

export const constructStore = (type: string, configuration: any): ConfigStore => {
  const StoreCtor = TYPE_TO_STORE_CTOR[type];
  if (!StoreCtor) {
    throw new Error(`unknown store type ${type}`);
  }
  return new StoreCtor(configuration);
};
