import _ from 'lodash';
import { JsonFileStore } from '@configu/node';
import { ProtocolToInit } from './types';

export const JsonFileStorePTI: ProtocolToInit = {
  [JsonFileStore.protocol]: async (url) => {
    // * json-file://path/to/file.json
    const jsonFilePath = _([url.hostname, url.pathname]).compact().join('/');
    return { url: url.href, store: new JsonFileStore(jsonFilePath) };
  },
};
