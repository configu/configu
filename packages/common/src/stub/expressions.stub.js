/* eslint-disable @typescript-eslint/no-var-requires */
import validator from 'validator';

export const isInt = () => validator.isInt('2');

export const Dotenv = (configs, opts) => {
  return configs.map(({ key, value }) => `${key}="${value}"`).join('\n');
};
