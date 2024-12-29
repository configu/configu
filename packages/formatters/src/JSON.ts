import { type FormatterFunction } from './ConfigFormatter';

export const JSONFormatter: FormatterFunction = (configs, { beautify = false }: { beautify?: boolean } = {}) =>
  JSON.stringify(configs, null, beautify ? 2 : 0);
