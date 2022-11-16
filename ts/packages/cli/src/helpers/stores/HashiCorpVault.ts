import _ from 'lodash';
import { URI } from '@configu/ts';
import { HashiCorpVaultStore } from '@configu/node';
import { SchemeToInit } from './types';

export const HashiCorpVaultStoreSTI: SchemeToInit = {
  [HashiCorpVaultStore.scheme]: async (uri) => {
    const parsedUri = URI.parse(uri);
    const queryDict = _.fromPairs(parsedUri.query?.split('&').map((query) => query.split('=')));
    const splittedUserinfo = parsedUri.userinfo?.split(':');

    // * hashicorp-vault://-
    if (parsedUri.host === '-') {
      const { VAULT_ADDR, VAULT_TOKEN } = process.env;

      if (!VAULT_ADDR || !VAULT_TOKEN || !queryDict.engine) {
        throw new Error(`invalid store uri ${uri}`);
      }

      return {
        uri: `${HashiCorpVaultStore.scheme}://${VAULT_TOKEN}@${VAULT_ADDR}`,
        store: new HashiCorpVaultStore({ address: VAULT_ADDR, token: VAULT_TOKEN, engine: queryDict.engine }),
      };
    }

    if (!splittedUserinfo || !splittedUserinfo[0] || !parsedUri.host || !queryDict.engine) {
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
        token: splittedUserinfo[0],
        engine: queryDict.engine,
      }),
    };
  },
};
