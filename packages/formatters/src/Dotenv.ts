import { type FormatterFunction } from './ConfigFormatter';
import { hasWhitespace } from './utils';

const hasSpecialCharacters = (value: string) => {
  return hasWhitespace(value) || /[#^]/.test(value);
};

export const DotenvFormatter: FormatterFunction = (configs, { wrap = false }: { wrap?: boolean } = {}) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      if (wrap || (typeof value === 'string' && hasSpecialCharacters(value))) {
        return `${key}="${value}"`; // * in case value has a special charachter or wrap is true, wrap with quotes around it
      }
      return `${key}=${value}`;
    })
    .join('\n');
};
