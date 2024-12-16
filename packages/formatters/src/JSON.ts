import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

export const JSONFormatter: FormatterFunction = (configs, { beautify = false }: { beautify?: boolean } = {}) =>
  JSON.stringify(configs, null, beautify ? 2 : 0);

ConfigFormatter.register('json', JSONFormatter);
ConfigFormatter.register('compact-json', (configs) => JSONFormatter(configs));
ConfigFormatter.register('beautified-json', (configs) => JSONFormatter(configs, { beautify: true }));
