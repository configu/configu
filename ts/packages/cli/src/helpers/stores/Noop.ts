import { NoopStore } from '@configu/node';
import { ProtocolToInit } from './types';

export const NoopStorePTI: ProtocolToInit = {
  [NoopStore.protocol]: async (url) => {
    // * noop://-
    return { url: url.href, store: new NoopStore() };
  },
};
