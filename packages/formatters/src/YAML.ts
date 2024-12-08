import { stringify } from 'yaml';
import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

export const YAMLFormatter: FormatterFunction = (
  configs,
  options?: Omit<Parameters<typeof stringify>['2'], string | number>,
) => stringify(configs, options);

ConfigFormatter.register('YAML', YAMLFormatter);
