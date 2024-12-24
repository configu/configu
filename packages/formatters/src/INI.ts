import { type FormatterFunction } from './ConfigFormatter';

export const INIFormatter: FormatterFunction = (configs) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      return `${key}=${value}`;
    })
    .join('\n');
};

// * TOML v1.0.0 spec: https://toml.io/en/v1.0.0
// ! formatter supports flat objects only
export const TOMLFormatter: FormatterFunction = (configs) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      if (typeof value === 'number' || typeof value === 'boolean') {
        return `${key} = ${value}`;
      }
      return `${key} = "${value}"`;
    })
    .join('\n');
};
