import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

const hasWhitespace = (str: string) => {
  return /\s/.test(str);
};

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

ConfigFormatter.register('dotenv', DotenvFormatter);
ConfigFormatter.register('env', DotenvFormatter);
ConfigFormatter.register('.env', DotenvFormatter);
