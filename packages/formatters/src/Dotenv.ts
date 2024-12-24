import { type FormatterFunction } from './ConfigFormatter';
import { hasWhitespace } from './utils';

export const DotenvFormatter: FormatterFunction = (configs, { wrap = false }: { wrap?: boolean } = {}) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      if (wrap || (typeof value === 'string' && hasWhitespace(value))) {
        return `${key}="${value}"`; // * in case value has a whitespace or wrap is true, wrap with quotes around it
      }
      return `${key}=${value}`;
    })
    .join('\n');
};
