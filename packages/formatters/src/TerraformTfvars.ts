import { snakeCase } from 'change-case';
import { type FormatterFunction } from './ConfigFormatter';

export const TfvarsFormatter: FormatterFunction = (configs) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      let formattedValue;
      if (typeof value === 'string') {
        formattedValue = `"${value}"`;
      } else {
        formattedValue = value;
      }
      return `${snakeCase(key)} = ${formattedValue}`;
    })
    .join('\n');
};
