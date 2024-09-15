const hasWhitespace = (str: string) => {
  return /\s/.test(str);
};
export const Dotenv = ({ json, wrap }) => {
  return Object.entries(json)
    .map(([key, value]: [string, string]) => {
      if (wrap || hasWhitespace(value)) {
        return `${key}="${value}"`; // * in case value has a whitespace or wrap is true, wrap with quotes around it
      }
      return `${key}=${value}`;
    })
    .join('\n');
};
