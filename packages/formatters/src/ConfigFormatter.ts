import _ from 'lodash';
import * as changeCase from 'change-case';

export const ConfigFormats = [
  'json',
  'compact-json',
  'beautified-json',

  'yml',
  'yaml',

  'ini',
  'toml',

  // dotenv
  'dotenv',
  'env',
  '.env',

  // 'k8s',
  'config-map',
  'k8s-config-map',
  'kubernetes-config-map',

  // 'helm',
  'helm-values',

  // 'terraform',
  'tfvars',
  'terraform-tfvars',
] as const;

export type ConfigFormat = (typeof ConfigFormats)[number];

// todo: find a way to reduce aliases to config formats name
// todo: find a way to deduce this from change-case lib
// https://github.com/blakeembrey/change-case/tree/main/packages/change-case
export const ConfigCases = [
  'camel',
  'capital',
  'constant',
  'dot',
  'kebab',
  'no',
  'pascal',
  'pascal-snake',
  'path',
  'sentence',
  'snake',
  'train',
] as const;

export type ConfigCase = (typeof ConfigCases)[number];

export type FormatterFunction = (configs: { [key: string]: unknown }, options?: Record<string, unknown>) => string;

export class ConfigFormatter {
  private static formats = new Map<string, FormatterFunction>();

  static register(format: ConfigFormat, formatter: FormatterFunction) {
    // todo: register as expression also
    // todo: find a way to reduce aliases to config formats name
    ConfigFormatter.formats.set(format, formatter);
  }

  // todo: replace caseNames:string with ConfigCase
  static changeCase(caseName: string, value: string): string {
    const configCase = changeCase.camelCase(`${caseName}-case`) as Exclude<
      keyof typeof changeCase,
      'split' | 'splitSeparateNumbers'
    >;
    const changeCaseFn = changeCase[configCase];
    if (!changeCaseFn) {
      throw new Error(`unknown case ${caseName}`);
    }
    return changeCaseFn(value);
  }

  // todo: replace formatName:string with ConfigFormat
  static format(
    formatName: string,
    configs: Parameters<FormatterFunction>['0'],
    options: Parameters<FormatterFunction>['1'],
  ): string {
    const formatter = ConfigFormatter.formats.get(formatName);
    if (!formatter) {
      throw new Error(`unknown format ${formatName}`);
    }
    return formatter(configs, options);
  }
}
