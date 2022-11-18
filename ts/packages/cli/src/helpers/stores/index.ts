import _ from 'lodash';
import { URI } from '@configu/ts';
import { SchemeToInit } from './types';
import { NoopStorePTI } from './Noop';
import { ConfiguStoreSTI } from './Configu';
import { JsonFileStoreSTI } from './JsonFile';
import { HashiCorpVaultStoreSTI } from './HashiCorpVault';
import { AwsSecretsManagerStoreSTI } from './AwsSecretsManager';
import {
  AuroraMysqlStoreSTI,
  AuroraPostgreSQLStoreSTI,
  CockroachStoreSTI,
  MSSQLStoreSTI,
  MariaStoreSTI,
  MySQLStoreSTI,
  PostgresSQLStoreSTI,
  SQLiteStoreSTI,
} from './TypeORM';

const SCHEME_TO_STORE_INIT_FN_DICT: SchemeToInit = {
  ...NoopStorePTI,
  ...ConfiguStoreSTI,
  ...JsonFileStoreSTI,
  ...HashiCorpVaultStoreSTI,
  ...AwsSecretsManagerStoreSTI,
  ...AuroraMysqlStoreSTI,
  ...AuroraPostgreSQLStoreSTI,
  ...CockroachStoreSTI,
  ...MSSQLStoreSTI,
  ...MariaStoreSTI,
  ...MySQLStoreSTI,
  ...PostgresSQLStoreSTI,
  ...SQLiteStoreSTI,
};

export const constructStoreFromUri = (uri: string) => {
  const parsedUri = URI.parse(uri);
  const queryDict = _.fromPairs(parsedUri.query?.split('&').map((query) => query.split('=')));
  const [user, password] = parsedUri.userinfo ? parsedUri.userinfo.split(':') : [];
  const storeInitFunction = SCHEME_TO_STORE_INIT_FN_DICT[parsedUri.scheme as string];
  if (!storeInitFunction) {
    throw new Error(`invalid store uri ${uri}`);
  }
  return storeInitFunction({ uri, parsedUri, queryDict, userinfo: [user, password] });
};
