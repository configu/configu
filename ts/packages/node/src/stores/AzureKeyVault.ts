import { DefaultAzureCredential, type DefaultAzureCredentialClientIdOptions } from '@azure/identity';
import { SecretClient, type SecretClientOptions } from '@azure/keyvault-secrets';
import { KeyValueConfigStore } from '@configu/ts';

export type AzureKeyVaultConfigStoreConfiguration = {
  vaultUrl: string;
  credential: DefaultAzureCredentialClientIdOptions;
  options?: SecretClientOptions;
};

export class AzureKeyVaultConfigStore extends KeyValueConfigStore {
  private client: SecretClient;
  constructor({ vaultUrl, credential, options }: AzureKeyVaultConfigStoreConfiguration) {
    super('azure-key-vault');

    this.client = new SecretClient(vaultUrl, new DefaultAzureCredential(credential), options);
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
