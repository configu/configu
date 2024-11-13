import { dump as ymlStringify } from 'js-yaml';

const DEFAULT_API_VERSION = 'v1';
const DEFAULT_KIND = 'ConfigMap';
export const jsonToKubernetesConfigMap = ({ json, label }) => {
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
