import { LiteralUnion } from 'type-fest';

export type StoreType = LiteralUnion<
  | 'noop'
  | 'in-memory'
  | 'configu'
  | 'json-file'
  | 'hashicorp-vault'
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

export const STORE_CONFIGURATION: Record<StoreType, Record<string, { required: boolean; env?: string }>> = {
  noop: {},
  'in-memory': {},
  configu: {
    org: { required: true, env: 'CONFIGU_ORG' },
    token: { required: true, env: 'CONFIGU_TOKEN' },
    endpoint: { required: false },
  },
  'json-file': {
    path: { required: true },
  },
  'hashicorp-vault': {
    token: { required: true, env: 'VAULT_TOKEN' },
    address: { required: true, env: 'VAULT_ADDR' },
  },
  'aws-secrets-manager': {
    accessKeyId: { required: true, env: 'AWS_ACCESS_KEY_ID' },
    secretAccessKey: { required: true, env: 'AWS_SECRET_ACCESS_KEY' },
    region: { required: true, env: 'AWS_REGION' },
    endpoint: { required: false },
  },
  'azure-key-vault': {
    clientId: { required: true, env: 'AZURE_CLIENT_ID' },
    clientSecret: { required: true, env: 'AZURE_CLIENT_SECRET' },
    tenantId: { required: true, env: 'AZURE_TENANT_ID' },
    vaultUrl: { required: true },
  },
  'gcp-secret-manager': {
    keyFile: { required: true, env: 'GOOGLE_APPLICATION_CREDENTIALS' },
    projectId: { required: true },
  },
  'kubernetes-secret': {
    kubeconfig: { required: true, env: 'KUBECONFIG' },
    namespace: { required: false },
  },
  sqlite: {
    database: { required: true },
  },
  mysql: {
    url: { required: true },
  },
  mariadb: {
    url: { required: true },
  },
  postgres: {
    url: { required: true },
  },
  cockroachdb: {
    url: { required: true },
  },
  mssql: {
    url: { required: true },
  },
};

export const getStoreConnectionStringPlaceholder = (store: StoreType) => {
  const storeConfigurationDefinition = STORE_CONFIGURATION[store];
  if (!storeConfigurationDefinition) {
    throw new Error(`unknown store type ${store}`);
  }
  let connectionStringPlaceholder = `store=${store}`;
  Object.entries(storeConfigurationDefinition).forEach(([key, settings]) => {
    const keyNode = `${key}=<${key}>`;
    const placeholder = settings.required ? `;${keyNode}` : `[;${keyNode}]`;
    connectionStringPlaceholder = `${connectionStringPlaceholder}${placeholder}`;
  });
  return connectionStringPlaceholder;
};

export const STORE_LABEL: Record<StoreType, string> = {
  noop: 'Noop',
  'in-memory': 'In Memory',
  configu: 'Configu',
  'json-file': 'Json File',
  'hashicorp-vault': 'HashiCorp Vault',
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
