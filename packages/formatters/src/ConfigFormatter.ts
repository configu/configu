import _ from 'lodash';

export const ConfigFormats = [
  'JSON',
  'CompactJSON',
  'BeautifiedJSON',
  'YAML',
  'INI',
  'TOML',

  // dotenv
  'Dotenv',
  'env',
  '.env',

  // 'k8s',
  'K8sConfigMap',
  'KubernetesConfigMap',

  // 'helm',
  'HelmValues',

  // 'terraform',
  'TerraformTfvars',
  'Tfvars',
] as const;

export type ConfigFormat = (typeof ConfigFormats)[number];

export type FormatterFunction = (configs: { [key: string]: unknown }, options?: Record<string, unknown>) => string;

export class ConfigFormatter {
  private static formats = new Map<string, FormatterFunction>();

  static register(format: ConfigFormat, formatter: FormatterFunction) {
    // todo: register as expression also
    // todo: find a way to reduce aliases to config formats name
    ConfigFormatter.formats.set(format, formatter);
  }

  static format(
    format: ConfigFormat,
    configs: Parameters<FormatterFunction>['0'],
    params: Parameters<FormatterFunction>['1'],
  ): string {
    const formatter = ConfigFormatter.formats.get(format);
    if (!formatter) {
      throw new Error(`unknown format ${format}`);
    }
    return formatter(configs, params);
  }
}
