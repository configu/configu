/* eslint-disable @typescript-eslint/no-var-requires */
import { ConfigStore } from '@configu/sdk';
import validator from 'validator';

export const isInt = () => validator.isInt('2');

export const Dotenv = (configs, opts) => {
  return configs.map(({ key, value }) => `${key}="${value}"`).join('\n');
};

export class ThrowConfigStore extends ConfigStore {
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}
