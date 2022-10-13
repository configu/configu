import { EvaluatedConfigs } from '@configu/ts';
import { ConfigSynchronizer } from '@configu/lib';

import { syncAwsLambdaEnvironmentVariables } from './AwsLambda';
import { syncHerokuConfigVars } from './Heroku';
import { syncGcpCloudFunctionsEnvVars } from './GcpCloudFunctions';

type HandlerParameters = {
  configuration: { [key in string]: string | boolean | undefined };
  configs: EvaluatedConfigs;
};
type HandlerFunction = (params: HandlerParameters) => Promise<void>;

export const SYNCHRONIZERS_HANDLERS: Record<ConfigSynchronizer, HandlerFunction> = {
  Heroku: syncHerokuConfigVars,
  Vercel: () => {
    throw new Error('Function not implemented.');
  },
  Netlify: () => {
    throw new Error('Function not implemented.');
  },
  Firebase: () => {
    throw new Error('Function not implemented.');
  },
  AwsLambda: syncAwsLambdaEnvironmentVariables,
  AzureFunctions: () => {
    throw new Error('Function not implemented.');
  },
  GcpCloudFunctions: syncGcpCloudFunctionsEnvVars,
  AwsEcs: () => {
    throw new Error('Function not implemented.');
  },
};
