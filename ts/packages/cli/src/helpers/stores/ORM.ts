import {
  AuroraMysqlStore,
  AuroraPostgreSQLStore,
  CockroachStore,
  MSSQLStore,
  MariaStore,
  MySQLStore,
  PostgreSQLStore,
  SQLiteStore,
} from '@configu/node';
import { InitFunctionParameters, SchemeToInit } from './types';

const GenerateORMSTI = async ({ uri, parsedUri, userinfo, queryDict }: InitFunctionParameters) => {
  const [username, password] = userinfo;
  const { database, region, secretArn, resourceArn } = queryDict;
  let host = `${parsedUri.host}${parsedUri.path}`;
  if (parsedUri.port) {
    host = host.concat(`:${parsedUri.port}`);
  }

  if (!username || !password || !host || !database) {
    throw new Error(`invalid store uri ${uri}`);
  }

  if (
    (parsedUri.scheme === AuroraMysqlStore.scheme || parsedUri.scheme === AuroraPostgreSQLStore.scheme) &&
    (!region || !secretArn || !resourceArn)
  ) {
    throw new Error(`invalid store uri ${uri}`);
  }

  // * <scheme>://username:password@host[?database=]
  return {
    uri,
    store: {
      host,
      database,
      username,
      password,
      region,
      secretArn,
      resourceArn,
    },
  };
};

export const PostgresSQLStoreSTI: SchemeToInit = {
  [PostgreSQLStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new PostgreSQLStore(store) };
  },
};

export const AuroraMysqlStoreSTI: SchemeToInit = {
  [AuroraMysqlStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new AuroraMysqlStore(store) };
  },
};

export const AuroraPostgreSQLStoreSTI: SchemeToInit = {
  [AuroraPostgreSQLStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new AuroraPostgreSQLStore(store) };
  },
};

export const CockroachStoreSTI: SchemeToInit = {
  [CockroachStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new CockroachStore(store) };
  },
};

export const MSSQLStoreSTI: SchemeToInit = {
  [MSSQLStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new MSSQLStore(store) };
  },
};

export const MariaStoreSTI: SchemeToInit = {
  [MariaStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new MariaStore(store) };
  },
};
export const MySQLStoreSTI: SchemeToInit = {
  [MySQLStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new MySQLStore(store) };
  },
};
export const SQLiteStoreSTI: SchemeToInit = {
  [SQLiteStore.scheme]: async (params) => {
    const { uri, store } = await GenerateORMSTI(params);
    return { uri, store: new SQLiteStore(store) };
  },
};
