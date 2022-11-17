import { Store, URI } from '@configu/ts';

type InitFunctionParameters = {
  uri: string;
  parsedUri: ReturnType<typeof URI.parse>;
  queryDict: Record<string, string>;
  userinfo: [string?, string?];
};

export type InitFunction = (params: InitFunctionParameters) => Promise<{ uri: string; store: Store }>;

export type SchemeToInit = Record<string, InitFunction>;
