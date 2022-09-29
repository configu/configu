export type AwsCredFlags = 'aws-region' | 'aws-access-key-id' | 'aws-secret-access-key' | 'aws-endpoint';
export type AzureCredFlags = 'azure-tenant-id' | 'azure-client-id' | 'azure-client-secret';
export type GcpCredFlags = 'gcp-key-file';
export type KubernetesCredFlags = 'kubernetes-kubeconfig-file';

export type ConfigSynchronizerCredFlags = AwsCredFlags | AzureCredFlags | GcpCredFlags | KubernetesCredFlags;

export type HerokuFlags = 'heroku-token' | 'heroku-app-uid';
export type VercelFlags = 'vercel-token' | 'vercel-app-uid';
export type NetlifyFlags = 'netlify-token' | 'netlify-site-id';
export type FirebaseFlags = 'firebase-token' | 'firebase-project';
export type AwsLambdaSpecificFlags = 'aws-function-name';
export type AwsLambdaFlags = AwsCredFlags | AwsLambdaSpecificFlags;
export type AzureFunctionsSpecificFlags = 'azure-subscription-id' | 'azure-resource-group' | 'azure-function-app';
export type AzureFunctionsFlags = AzureCredFlags | AzureFunctionsSpecificFlags;
export type GcpCloudFunctionsSpecificFlags = 'gcp-cloud-function-name';
export type GcpCloudFunctionsFlags = GcpCredFlags | GcpCloudFunctionsSpecificFlags;
export type AwsEcsFlags = 'aws-ecs-task-definition' | 'aws-ecs-container-name';

export type ConfigSynchronizerFlags =
  | HerokuFlags
  | VercelFlags
  | NetlifyFlags
  | FirebaseFlags
  | AwsLambdaFlags
  | AzureFunctionsFlags
  | GcpCloudFunctionsFlags
  | AwsEcsFlags;
