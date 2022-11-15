import { URI } from '@configu/ts';
import { SchemeToInit } from './types';
import { NoopStorePTI } from './Noop';
import { ConfiguStoreSTI } from './Configu';
import { JsonFileStoreSTI } from './JsonFile';
import { HashiCorpVaultStoreSTI } from './HashiCorpVault';
import { AwsSecretsManagerStoreSTI } from './AwsSecretsManager';

const SCHEME_TO_STORE_INIT_FN_DICT: SchemeToInit = {
  ...NoopStorePTI,
  ...ConfiguStoreSTI,
  ...JsonFileStoreSTI,
  ...HashiCorpVaultStoreSTI,
  ...AwsSecretsManagerStoreSTI,
};

export const constructStoreFromUri = (uri: string) => {
  const storeUri = URI.parse(uri);

  console.log(storeUri); // TODO -remove

  const storeInitFunction = SCHEME_TO_STORE_INIT_FN_DICT[storeUri.scheme as string];
  if (!storeInitFunction) {
    throw new Error(`invalid store uri ${uri}`);
  }
  return storeInitFunction(uri);
};
