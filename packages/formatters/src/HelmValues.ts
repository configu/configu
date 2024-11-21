import _ from 'lodash';
import { camelCase } from 'change-case';
import { stringify } from 'yaml';
import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

// * Helm values naming convention is camel case (https://helm.sh/docs/chart_best_practices/values/)
export const HelmValuesFormatter: FormatterFunction = (configs) => {
  const camelCaseKeys = _.mapKeys(configs, (v, k) => camelCase(k));
  return stringify(camelCaseKeys);
};

ConfigFormatter.register('HelmValues', HelmValuesFormatter);
