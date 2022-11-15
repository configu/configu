import { Store } from '@configu/ts';

export type InitFunction = (uri: string) => Promise<{ uri: string; store: Store }>;

export type SchemeToInit = Record<string, InitFunction>;
