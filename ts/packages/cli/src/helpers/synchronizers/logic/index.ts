import { EvaluatedConfigs } from '@configu/ts';
import { ConfigSynchronizer } from '@configu/lib';

import { syncAwsLambdaEnvironmentVariables } from './AwsLambda';
import { syncHerokuConfigVars } from './Heroku';
import { syncVercelEnvironmentVariables } from './Vercel';
import { syncNetlifyEnvironmentVariables } from './Netlify';

type HandlerParameters = {
  configuration: { [key in string]: string | boolean | undefined };
  configs: EvaluatedConfigs;
};
type HandlerFunction = (params: HandlerParameters) => Promise<void>;

export const SYNCHRONIZERS_HANDLERS: Record<ConfigSynchronizer, HandlerFunction> = {
  Heroku: syncHerokuConfigVars,
  Vercel: syncVercelEnvironmentVariables,
  Netlify: syncNetlifyEnvironmentVariables,
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
