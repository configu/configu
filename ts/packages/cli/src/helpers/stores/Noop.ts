import { NoopStore } from '@configu/node';
import { SchemeToInit } from './types';

export const NoopStorePTI: SchemeToInit = {
  [NoopStore.scheme]: async ({ uri }) => {
    // * noop://-
    return { uri, store: new NoopStore() };
  },
};
