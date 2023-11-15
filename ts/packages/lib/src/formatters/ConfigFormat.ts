export type ConfigFormat =
  | 'JSON'
  | 'CompactJSON'
  | 'YAML'
  | 'Dotenv'
  | 'KubernetesConfigMap'
  | 'HelmValues'
  | 'TerraformTfvars'
  | 'TOML';

export const CONFIG_FORMAT_LABEL: Record<ConfigFormat, string> = {
  JSON: 'JSON',
  CompactJSON: 'JSON',
  YAML: 'YAML',
  Dotenv: '.env',
  KubernetesConfigMap: 'Kubernetes ConfigMap',
  HelmValues: 'Helm Values',
  TerraformTfvars: 'Terraform Tfvars',
  TOML: 'TOML',
};

export const CONFIG_FORMAT_EXTENSION: Record<ConfigFormat, string> = {
  JSON: 'json',
  CompactJSON: 'json',
  YAML: 'yaml',
  Dotenv: 'env',
  KubernetesConfigMap: 'yaml',
  HelmValues: 'yaml',
  TerraformTfvars: 'tfvars',
  TOML: 'toml',
};

export const CONFIG_FORMAT_TYPE = Object.keys(CONFIG_FORMAT_LABEL) as ConfigFormat[];
