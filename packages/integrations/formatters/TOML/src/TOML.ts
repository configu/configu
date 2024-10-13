import validator from 'validator';

// * TOML v1.0.0 spec: https://toml.io/en/v1.0.0
// ! formatter supports flat objects only
export const TOML = ({ json }) => {
  return Object.entries(json)
    .map(([key, value]: [string, string]) => {
      if (validator.isNumeric(value) || validator.isBoolean(value, { loose: true })) {
        return `${key} = ${value}`;
      }
      return `${key} = "${value}"`;
    })
    .join('\n');
};
