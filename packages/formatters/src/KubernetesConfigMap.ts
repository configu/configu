import { stringify } from 'yaml';
import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

const DEFAULT_API_VERSION = 'v1';
const DEFAULT_KIND = 'ConfigMap';

const KubernetesConfigMapFormatter: FormatterFunction = (configs, options: { label?: string } = { label: '' }) => {
  const jsonConfigMap = {
    apiVersion: DEFAULT_API_VERSION,
    kind: DEFAULT_KIND,
    metadata: {
      creationTimestamp: new Date().toISOString(),
      name: (options.label ?? `configs-${Date.now()}`).toLowerCase(),
    },
    data: configs,
  };

  return stringify(jsonConfigMap);
};

ConfigFormatter.register('K8sConfigMap', KubernetesConfigMapFormatter);
ConfigFormatter.register('KubernetesConfigMap', KubernetesConfigMapFormatter);
