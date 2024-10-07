export const isInt = (str) => parseInt(str, 10).toString() === str;

export const Dotenv = (configs, opts) => {
  return configs.map(({ key, value }) => `${key}="${value}"`).join('\n');
};
