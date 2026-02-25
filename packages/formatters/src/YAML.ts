import _ from 'lodash';
import { stringify } from 'yaml';
import { camelCase } from 'change-case';
import { type FormatterFunction } from './ConfigFormatter';

type YAMLFormatterOptions = Exclude<Parameters<typeof stringify>['2'], string | number>;
export const YAMLFormatter: FormatterFunction = (configs, options?: YAMLFormatterOptions) =>
  stringify(configs, options);

const ensureStringValue = (config: { [key: string]: unknown }) =>
  Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      switch (typeof value) {
        case 'number':
          return [key, value.toString()];
        case 'boolean':
          return [key, value.toString()];
        default:
          return [key, value];
      }
    }),
  );

const DEFAULT_API_VERSION = 'v1';
const DEFAULT_KIND = 'ConfigMap';
export const KubernetesConfigMapFormatter: FormatterFunction = (
  configs,
  options?: YAMLFormatterOptions & { name?: string; metadata?: Record<string, string> },
) => {
  const jsonConfigMap = {
    apiVersion: DEFAULT_API_VERSION,
    kind: DEFAULT_KIND,
    metadata: {
      creationTimestamp: new Date().toISOString(),
      ...options?.metadata,
      name: options?.name?.toLowerCase(),
    },
    data: ensureStringValue(configs),
  };

  return YAMLFormatter(jsonConfigMap);
};

// * Helm values naming convention is camel case (https://helm.sh/docs/chart_best_practices/values/)
export const HelmValuesFormatter: FormatterFunction = (configs, options?: YAMLFormatterOptions) => {
  const camelCaseKeys = _.mapKeys(configs, (v, k) => camelCase(k));
  return YAMLFormatter(camelCaseKeys, options);
};
