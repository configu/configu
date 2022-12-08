import { ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { KeyValueStore } from '@configu/ts';

type AzureKeyVaultConfiguration = {
  credentials: { tenantId: string; clientId: string; clientSecret: string };
  vaultUrl: string;
};

export class AzureKeyVaultStore extends KeyValueStore {
  static readonly type = 'azure-key-vault';
  private client: SecretClient;
  constructor({ credentials: { clientId, clientSecret, tenantId }, vaultUrl }: AzureKeyVaultConfiguration) {
    super(AzureKeyVaultStore.type, { keySeparator: '-' });

    const clientCredentials = new ClientSecretCredential(tenantId, clientId, clientSecret);
    this.client = new SecretClient(vaultUrl, clientCredentials);
  }

  // * https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-secrets/secretclient?view=azure-node-latest#@azure-keyvault-secrets-secretclient-getsecret
  async getByKey(key: string): Promise<string> {
    const keyVaultSecret = await this.client.getSecret(key);
    const secret = keyVaultSecret?.value;
    return secret ?? '';
  }

  // * https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-secrets/secretclient?view=azure-node-latest#@azure-keyvault-secrets-secretclient-setsecret
  async upsert(key: string, value: string): Promise<void> {
    await this.client.setSecret(key, value);
  }

  // * https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-secrets/secretclient?view=azure-node-latest#@azure-keyvault-secrets-secretclient-begindeletesecret
  async delete(key: string): Promise<void> {
    // ! This operation does not immediately remove secrets, attempting to upsert before absolute deletion is complete will throw an error
    await this.client.beginDeleteSecret(key);
  }
}
