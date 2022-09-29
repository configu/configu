import { LambdaClient, UpdateFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { EvaluatedConfigs } from '@configu/ts';
import { CONFIG_SYNCHRONIZER_LABEL } from '@configu/lib';

const label = CONFIG_SYNCHRONIZER_LABEL.AwsLambda;

export type AwsLambdaConfiguration = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  functionName: string;
};

export const syncAwsLambdaEnvironmentVariables = async ({
  configuration,
  configs,
}: {
  configuration: Partial<AwsLambdaConfiguration>;
  configs: EvaluatedConfigs;
}) => {
  const { accessKeyId, secretAccessKey, region, functionName } = configuration;
  if (!accessKeyId || !secretAccessKey || !region || !functionName) {
    throw new Error(`${label} credentials are missing`);
  }

  const client = new LambdaClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const updateParams = {
    FunctionName: functionName,
    Environment: { Variables: configs },
  };
  const updateCommand = new UpdateFunctionConfigurationCommand(updateParams);
  await client.send(updateCommand);
};
