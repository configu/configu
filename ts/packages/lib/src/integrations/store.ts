import { LiteralUnion } from 'type-fest';

export type StoreType = LiteralUnion<
  | 'noop'
  | 'in-memory'
  | 'configu'
  | 'json-file'
  | 'hashicorp-vault'
  | 'aws-parameter-store'
  | 'aws-secrets-manager'
  | 'azure-key-vault'
  | 'gcp-secret-manager'
  | 'kubernetes-secret'
  | 'sqlite'
  | 'mysql'
  | 'mariadb'
  | 'postgres'
  | 'cockroachdb'
  | 'mssql',
  string
>;

export const STORE_LABEL: Record<StoreType, string> = {
  noop: 'Noop',
  'in-memory': 'In Memory',
  configu: 'Configu',
  'json-file': 'Json File',
  'hashicorp-vault': 'HashiCorp Vault',
  'aws-parameter-store': 'AWS Parameter Store',
  'aws-secrets-manager': 'AWS Secrets Manager',
  'azure-key-vault': 'Azure Key Vault',
  'gcp-secret-manager': 'GCP Secret Manager',
  'kubernetes-secret': 'Kubernetes Secret',
  sqlite: 'SQLite',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  postgres: 'PostgreSQL',
  cockroachdb: 'CockroachDB',
  mssql: 'Microsoft SQL Server',
};

export const STORE_WEBSITE: Record<StoreType, string> = {
  noop: '',
  'in-memory': '',
  configu: 'https://configu.com/',
  'json-file': 'https://www.json.org/json-en.html',
  'hashicorp-vault': 'https://www.vaultproject.io/',
  'aws-parameter-store':
    'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html',
  'aws-secrets-manager': 'https://aws.amazon.com/secrets-manager/',
  'azure-key-vault': 'https://azure.microsoft.com/en-us/services/key-vault/',
  'gcp-secret-manager': 'https://cloud.google.com/secret-manager/',
  'kubernetes-secret': 'https://kubernetes.io/docs/concepts/configuration/secret/',
  sqlite: 'https://www.sqlite.org/index.html',
  mysql: 'https://www.mysql.com/',
  mariadb: 'https://mariadb.org/',
  postgres: 'https://www.postgresql.org/',
  cockroachdb: 'https://www.cockroachlabs.com/',
  mssql: 'https://www.microsoft.com/en-gb/sql-server',
};

export const STORE_TYPE = Object.keys(STORE_LABEL) as StoreType[];
