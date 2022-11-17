import { HashiCorpVaultStore } from '@configu/node';
import { SchemeToInit } from './types';

export const HashiCorpVaultStoreSTI: SchemeToInit = {
  [HashiCorpVaultStore.scheme]: async ({ uri, parsedUri, queryDict, userinfo }) => {
    const token = userinfo[0];

    if (!queryDict.engine) {
      throw new Error(`invalid store uri ${uri}`);
    }

    // * hashicorp-vault://-
    if (parsedUri.host === '-') {
      const { VAULT_ADDR, VAULT_TOKEN } = process.env;

      if (!VAULT_ADDR || !VAULT_TOKEN) {
        throw new Error(`invalid store uri ${uri}`);
      }

      return {
        uri: `${HashiCorpVaultStore.scheme}://${VAULT_TOKEN}@${VAULT_ADDR}`,
        store: new HashiCorpVaultStore({ address: VAULT_ADDR, token: VAULT_TOKEN, engine: queryDict.engine }),
      };
    }

    if (!token || !parsedUri.host) {
      throw new Error(`invalid store uri ${uri}`);
    }

    let address = parsedUri.host;
    if (queryDict.protocol) {
      address = `${queryDict.protocol}://${parsedUri.host}`;
    }
    if (parsedUri.port) {
      address = address.concat(`:${parsedUri.port}`);
    }
    // * hashicorp-vault://token@address[&engine=][?protocol=]
    return {
      uri,
      store: new HashiCorpVaultStore({
        address,
        token,
        engine: queryDict.engine,
      }),
    };
  },
};
