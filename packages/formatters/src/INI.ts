import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

export const INIFormatter: FormatterFunction = (configs) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      return `${key}=${value}`;
    })
    .join('\n');
};

ConfigFormatter.register('INI', INIFormatter);
