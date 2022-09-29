import { URL } from 'url';
import { Store } from '@configu/ts';

export type InitFunction = (url: URL) => Promise<{ url: string; store: Store }>;

export type ProtocolToInit = Record<string, InitFunction>;
