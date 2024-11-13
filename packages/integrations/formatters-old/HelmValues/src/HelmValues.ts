import { camelCase } from 'change-case';
import { mapKeys } from 'lodash-es';
import { dump as ymlStringify } from 'js-yaml';

// * Helm values naming convention is camel case (https://helm.sh/docs/chart_best_practices/values/)
export const HelmValues = ({ json }) => {
  const camelCaseKeys = mapKeys(json, (v, k) => camelCase(k));
  return ymlStringify(camelCaseKeys);
};
