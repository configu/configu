import _ from 'lodash';
import { URI } from '@configu/ts';
import { JsonFileStore } from '@configu/node';
import { SchemeToInit } from './types';

export const JsonFileStoreSTI: SchemeToInit = {
  [JsonFileStore.scheme]: async (uri) => {
    const parsedUri = URI.parse(uri);
    // * json-file://path/to/file.json
    const jsonFilePath = _([parsedUri.host, parsedUri.path]).compact().join('/');
    return { uri, store: new JsonFileStore(jsonFilePath) };
  },
};
