import { cwd } from 'process';
import path from 'path';
import _ from 'lodash';

export const getPathBasename = (pathname = cwd()) => path.basename(path.resolve(pathname));

export const reduceConfigFlag = (configFlag: string[] | undefined) => {
  return _(configFlag)
    .map((pair, idx) => {
      const [key, value] = pair.split('=');
      if (!key) {
        throw new Error(`config key is missing at --config[${idx}]`);
      }
      return { key, value: value ?? '' };
    })
    .keyBy('key')
    .mapValues('value')
    .value();
};

export * from './stores';
