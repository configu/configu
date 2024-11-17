import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

export const JSONFormatter: FormatterFunction = (configs, { beautify = false }: { beautify?: boolean } = {}) =>
  JSON.stringify(configs, null, beautify ? 2 : 0);

ConfigFormatter.register('JSON', JSONFormatter);
ConfigFormatter.register('CompactJSON', (configs) => JSONFormatter(configs));
ConfigFormatter.register('BeautifiedJSON', (configs) => JSONFormatter(configs, { beautify: true }));
