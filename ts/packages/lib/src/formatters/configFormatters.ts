import _ from 'lodash';
import { camelCase, snakeCase } from 'change-case';
import { dump as ymlStringify } from 'js-yaml';
import validator from 'validator';
import type { ExportCommandReturn } from '@configu/ts';
import type { ConfigFormat } from './ConfigFormat';

const hasWhitespace = (str: string) => {
  return /\s/.test(str);
};

type FormatterParameters = {
  json: ExportCommandReturn;
  label: string;
  wrap?: boolean; // * Wraps all values with quotes
};
type FormatterFunction = (params: FormatterParameters) => string;

const jsonToDotenv: FormatterFunction = ({ json, wrap }) => {
  return Object.entries(json)
    .map(([key, value]) => {
      if (wrap || hasWhitespace(value)) {
        return `${key}="${value}"`; // * in case value has a whitespace or wrap is true, wrap with quotes around it
      }
      return `${key}=${value}`;
    })
    .join('\n');
};

const jsonToTfvars: FormatterFunction = ({ json }) => {
  return Object.entries(json)
    .map(([key, value]) => `${snakeCase(key)} = "${value}"`)
    .join('\n');
};

// * TOML v1.0.0 spec: https://toml.io/en/v1.0.0
// ! formatter supports flat objects only
const jsonToToml: FormatterFunction = ({ json }) => {
  return Object.entries(json)
    .map(([key, value]) => {
      if (validator.isNumeric(value) || validator.isBoolean(value, { loose: true })) {
        return `${key} = ${value}`;
      }
      return `${key} = "${value}"`;
    })
    .join('\n');
};

const DEFAULT_API_VERSION = 'v1';
const DEFAULT_KIND = 'ConfigMap';
const jsonToKubernetesConfigMap: FormatterFunction = ({ json, label }) => {
  const jsonConfigMap = {
    apiVersion: DEFAULT_API_VERSION,
    kind: DEFAULT_KIND,
    metadata: {
      creationTimestamp: new Date().toISOString(),
      name: label.toLowerCase(),
    },
    data: json,
  };

  return ymlStringify(jsonConfigMap);
};

// * Helm values naming convention is camel case (https://helm.sh/docs/chart_best_practices/values/)
const jsonToHelmValues: FormatterFunction = ({ json }) => {
  const cameledKeys = _.mapKeys(json, (v, k) => camelCase(k));
  return ymlStringify(cameledKeys);
};

const configFormatters: Record<ConfigFormat, FormatterFunction> = {
  JSON: ({ json }) => JSON.stringify(json, null, 2),
  CompactJSON: ({ json }) => JSON.stringify(json),
  YAML: ({ json }) => ymlStringify(json),
  Dotenv: jsonToDotenv,
  KubernetesConfigMap: jsonToKubernetesConfigMap,
  HelmValues: jsonToHelmValues,
  TerraformTfvars: jsonToTfvars,
  TOML: jsonToToml,
};

export const formatConfigs = ({ format, ...restParams }: FormatterParameters & { format: ConfigFormat }) => {
  const formatter = configFormatters[format];
  if (!formatter) {
    throw new Error(`${format} is not supported`);
  }
  return formatter(restParams);
};
