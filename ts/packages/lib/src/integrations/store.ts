import { type LiteralUnion } from 'type-fest';

export type StoreType = LiteralUnion<
  | 'noop'
  | 'in-memory'
  | 'configu'
  | 'json-file'
  | 'ini-file'
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
  | 'mssql'
  | 'launch-darkly'
  | 'cloud-bees',
  string
>;

export const STORE_LABEL: Record<StoreType, string> = {
  noop: 'Noop',
  'in-memory': 'In Memory',
  configu: 'Configu',
  'json-file': 'Json File',
  'ini-file': 'INI File',
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
  'launch-darkly': 'LaunchDarkly',
  'cloud-bees': 'CloudBees',
};

export const STORE_WEBSITE: Record<StoreType, string> = {
  noop: '',
  'in-memory': '',
  configu: 'https://configu.com/',
  'json-file': 'https://www.json.org/json-en.html',
  'ini-file': 'https://en.wikipedia.org/wiki/INI_file',
  'hashicorp-vault': 'https://www.vaultproject.io/',
  'aws-parameter-store': 'https://aws.amazon.com/systems-manager/features/#Parameter_Store',
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
  'launch-darkly': 'https://launchdarkly.com/',
  'cloud-bees': 'https://www.cloudbees.com/products/cloudbees-feature-management/',
};

export const STORE_TYPE = Object.keys(STORE_LABEL) as StoreType[];
