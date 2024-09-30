import { Config, ConfigQuery, ConfigStore } from '@configu/sdk';
import * as validator from 'validator';

// eslint-disable-next-line prefer-destructuring
export const isInt = () => validator.isInt('2');

export const Dotenv = (configs: Config[], opts: any) => {
  return configs.map(({ key, value }) => `${key}="${value}"`).join('\n');
};

export class ThrowConfigStore extends ConfigStore {
  get(queries: ConfigQuery[]): Promise<Config[]> {
    throw new Error('Method not implemented.');
  }

  set(configs: Config[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
