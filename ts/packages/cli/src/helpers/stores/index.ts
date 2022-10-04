import { URL } from 'url';
import { ProtocolToInit } from './types';

import { NoopStorePTI } from './Noop';
import { ConfiguStorePTI } from './Configu';
import { JsonFileStorePTI } from './JsonFile';
import { HashiCorpVaultStorePTI } from './HashiCorpVault';
import { AwsSecretsManagerStorePTI } from './AwsSecretsManager';

const PROTOCOL_TO_STORE_INIT_FN_DICT: ProtocolToInit = {
  ...NoopStorePTI,
  ...ConfiguStorePTI,
  ...JsonFileStorePTI,
  ...HashiCorpVaultStorePTI,
  ...AwsSecretsManagerStorePTI,
};

export const constructStoreFromUrl = (url: string) => {
  const storeUrl = new URL(url);
  const storeProtocol = storeUrl.protocol.slice(0, -1);
  const storeInitFunction = PROTOCOL_TO_STORE_INIT_FN_DICT[storeProtocol];
  if (!storeInitFunction) {
    throw new Error(`invalid store url ${url}`);
  }
  return storeInitFunction(storeUrl);
};
