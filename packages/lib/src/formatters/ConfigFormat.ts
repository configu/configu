export type ConfigFormat =
  | 'JSON'
  | 'YAML'
  | 'Dotenv'
  | 'KubernetesConfigMap'
  | 'HelmValues'
  | 'TerraformTfvars'
  | 'TOML'
  | 'INI';

export const CONFIG_FORMAT_LABEL: Record<ConfigFormat, string> = {
  JSON: 'JSON',
  YAML: 'YAML',
  Dotenv: '.env',
  KubernetesConfigMap: 'Kubernetes ConfigMap',
  HelmValues: 'Helm Values',
  TerraformTfvars: 'Terraform Tfvars',
  TOML: 'TOML',
  INI: 'INI',
};

export const CONFIG_FORMAT_EXTENSION: Record<ConfigFormat, string> = {
  JSON: 'json',
  YAML: 'yaml',
  Dotenv: 'env',
  KubernetesConfigMap: 'yaml',
  HelmValues: 'yaml',
  TerraformTfvars: 'tfvars',
  TOML: 'toml',
  INI: 'ini',
};

export const CONFIG_FORMAT_TYPE = Object.keys(CONFIG_FORMAT_LABEL) as ConfigFormat[];
