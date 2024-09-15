import { snakeCase } from 'change-case';

export const jsonToTfvars = ({ json }) => {
  return Object.entries(json)
    .map(([key, value]) => {
      let formattedValue: string;
      try {
        JSON.parse(value as any);
        formattedValue = value as string;
      } catch (err) {
        formattedValue = `"${value}"`;
      }
      return `${snakeCase(key)} = ${formattedValue}`;
    })
    .join('\n');
};
