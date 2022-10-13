import { CloudFunctionsServiceClient } from '@google-cloud/functions';
import { EvaluatedConfigs } from '@configu/ts';
import { CONFIG_SYNCHRONIZER_LABEL } from '@configu/lib';

const label = CONFIG_SYNCHRONIZER_LABEL.GcpCloudFunctions;

export type GcpCloudFunctionsConfiguration = {
  // * GCP Cloud Functions docs: https://cloud.google.com/functions/docs/configuring/env-var
  keyFile: string;
  functionName: string;
};

// TODO - Decide between syncGcpCloudFunctionsConfigs (previous name) and syncGcpCloudFunctionsEnvVars
export const syncGcpCloudFunctionsEnvVars = async ({
  configuration,
  configs,
}: {
  configuration: Partial<GcpCloudFunctionsConfiguration>;
  configs: EvaluatedConfigs;
}) => {
  const { keyFile, functionName } = configuration;
  if (!keyFile || !functionName) {
    throw new Error(`${label} credentials are missing`);
  }

  const client = new CloudFunctionsServiceClient({ keyFile });

  await client.updateFunction({
    function: { name: functionName, environmentVariables: configs },
    updateMask: { paths: ['environment_variables'] },
  });
};
