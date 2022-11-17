import _ from 'lodash';
import { JsonFileStore } from '@configu/node';
import { SchemeToInit } from './types';

export const JsonFileStoreSTI: SchemeToInit = {
  [JsonFileStore.scheme]: async ({ uri, parsedUri }) => {
    // * json-file://path/to/file.json
    const jsonFilePath = `${parsedUri.host}${parsedUri.path}`;
    return { uri, store: new JsonFileStore(jsonFilePath) };
  },
};
