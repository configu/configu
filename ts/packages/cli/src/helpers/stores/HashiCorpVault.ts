import { HashiCorpVaultStore } from '@configu/node';
import { ProtocolToInit } from './types';

export const HashiCorpVaultStorePTI: ProtocolToInit = {
  [HashiCorpVaultStore.protocol]: async (url) => {
    // * hashicorp-vault://-
    if (url.hostname === '-') {
      const { VAULT_ADDR, VAULT_TOKEN } = process.env;

      if (!VAULT_ADDR || !VAULT_TOKEN) {
        throw new Error(`invalid store url ${url}`);
      }

      return {
        url: `${HashiCorpVaultStore.protocol}://${VAULT_TOKEN}@${VAULT_ADDR}`,
        store: new HashiCorpVaultStore({ address: VAULT_ADDR, token: VAULT_TOKEN }),
      };
    }

    // * hashicorp-vault://token@address[?protocol=]
    const protocol = url.searchParams.get('protocol');
    let address = url.host;
    if (protocol) {
      address = `${protocol}://${url.host}`;
    }
    return { url: url.href, store: new HashiCorpVaultStore({ address, token: url.username }) };
  },
};
