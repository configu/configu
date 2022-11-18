import { AzureKeyVaultStore } from '@configu/node';
import { SchemeToInit } from './types';

export const AzureKeyVaultStoreSTI: SchemeToInit = {
  [AzureKeyVaultStore.scheme]: async ({ uri, parsedUri, queryDict, userinfo }) => {
    const tenantId = parsedUri.host;
    const { vaultUrl } = queryDict;
    const [clientId, clientSecret] = userinfo;

    // * azure-key-vault://-[?vaultUrl=]
    if (parsedUri.host === '-') {
      const { AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID } = process.env;

      if (!vaultUrl || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET || !AZURE_TENANT_ID) {
        throw new Error(`invalid store uri ${uri}`);
      }

      return {
        uri,
        store: new AzureKeyVaultStore({
          credentials: { clientId: AZURE_CLIENT_ID, clientSecret: AZURE_CLIENT_SECRET, tenantId: AZURE_TENANT_ID },
          vaultUrl,
        }),
      };
    }

    if (!vaultUrl || !tenantId || !clientId || !clientSecret) {
      throw new Error(`invalid store uri ${uri}`);
    }

    // * azure-key-vault://clientId:clientSecret@tenantId[?vaultUrl=]
    return {
      uri,
      store: new AzureKeyVaultStore({ credentials: { clientId, clientSecret, tenantId }, vaultUrl }),
    };
  },
};
