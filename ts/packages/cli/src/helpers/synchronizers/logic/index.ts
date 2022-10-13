import { EvaluatedConfigs } from '@configu/ts';
import { ConfigSynchronizer } from '@configu/lib';

import { syncAwsLambdaEnvironmentVariables } from './AwsLambda';
import { syncHerokuConfigVars } from './Heroku';
import { syncVercelEnvVars } from './Vercel';

type HandlerParameters = {
  configuration: { [key in string]: string | boolean | undefined };
  configs: EvaluatedConfigs;
};
type HandlerFunction = (params: HandlerParameters) => Promise<void>;

export const SYNCHRONIZERS_HANDLERS: Record<ConfigSynchronizer, HandlerFunction> = {
  Heroku: syncHerokuConfigVars,
  Vercel: syncVercelEnvVars,
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
  GcpCloudFunctions: () => {
    throw new Error('Function not implemented.');
  },
  AwsEcs: () => {
    throw new Error('Function not implemented.');
  },
};
