export type SecretManager =
  | 'HashiCorpVault'
  | 'AwsSecretsManager'
  | 'AzureKeyVault'
  | 'GcpSecretManager'
  | 'KubernetesSecret';

export const SECRET_MANAGER_LABEL: Record<SecretManager, string> = {
  HashiCorpVault: 'HashiCorp Vault',
  AzureKeyVault: 'Azure Key Vault',
  AwsSecretsManager: 'AWS Secrets Manager',
  GcpSecretManager: 'GCP Secret Manager',
  KubernetesSecret: 'Kubernetes Secret',
};
export const SECRET_MANAGER_WEBSITE: Record<SecretManager, string> = {
  HashiCorpVault: 'https://www.vaultproject.io/',
  AzureKeyVault: 'https://azure.microsoft.com/en-us/services/key-vault/',
  AwsSecretsManager: 'https://aws.amazon.com/secrets-manager/',
  GcpSecretManager: 'https://cloud.google.com/secret-manager/',
  KubernetesSecret: 'https://kubernetes.io/docs/concepts/configuration/secret/',
};

export const SECRET_MANAGER_TYPE = Object.keys(SECRET_MANAGER_LABEL) as SecretManager[];
