import { LiteralUnion } from 'type-fest';

export type StoreType = LiteralUnion<
  | 'noop'
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
  configu: {
    token: { required: true, env: 'CONFIGU_TOKEN' },
    org: { required: true, env: 'CONFIGU_ORG' },
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

export const STORE_LABEL: Record<StoreType, string> = {
  HashiCorpVault: 'HashiCorp Vault',
  AzureKeyVault: 'Azure Key Vault',
  AwsSecretsManager: 'AWS Secrets Manager',
  GcpSecretManager: 'GCP Secret Manager',
  KubernetesSecret: 'Kubernetes Secret',
  noop: 'Noop',
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

// export const STORE_WEBSITE: Record<StoreType, string> = {
//   HashiCorpVault: 'https://www.vaultproject.io/',
//   AzureKeyVault: 'https://azure.microsoft.com/en-us/services/key-vault/',
//   AwsSecretsManager: 'https://aws.amazon.com/secrets-manager/',
//   GcpSecretManager: 'https://cloud.google.com/secret-manager/',
//   KubernetesSecret: 'https://kubernetes.io/docs/concepts/configuration/secret/',
// };

export const STORE_TYPE = Object.keys(STORE_LABEL) as StoreType[];
