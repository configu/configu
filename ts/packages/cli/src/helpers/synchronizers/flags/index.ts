import { ConfigSynchronizer } from '@configu/lib';
import { ExtractorFunction } from './types';

import { AWS_CRED_FLAGS } from './Aws';
import { AZURE_CRED_FLAGS } from './Azure';
import { GCP_CRED_FLAGS } from './Gcp';
import { HEROKU_FLAGS, extractHerokuFlags } from './Heroku';
import { VERCEL_FLAGS, extractVercelFlags } from './Vercel';
import { NETLIFY_FLAGS, extractNetlifyFlags } from './Netlify';
import { FIREBASE_FLAGS, extractFirebaseFlags } from './Firebase';
import { AWS_LAMBDA_FLAGS, extractAwsLambdaFlags } from './AwsLambda';
import { AZURE_FUNCTIONS_FLAGS, extractAzureFunctionsFlags } from './AzureFunctions';
import { GCP_CLOUD_FUNCTIONS_FLAGS, extractGcpCloudFunctionsFlags } from './GcpCloudFunctions';
import { AWS_ECS_FLAGS, extractAwsEcsFlags } from './AwsEcs';

export * from './types';

export const SYNCHRONIZERS_FLAGS_DICT = {
  ...AWS_CRED_FLAGS,
  ...AZURE_CRED_FLAGS,
  ...GCP_CRED_FLAGS,
  ...HEROKU_FLAGS,
  ...VERCEL_FLAGS,
  ...NETLIFY_FLAGS,
  ...FIREBASE_FLAGS,
  ...AWS_LAMBDA_FLAGS,
  ...AZURE_FUNCTIONS_FLAGS,
  ...GCP_CLOUD_FUNCTIONS_FLAGS,
  ...AWS_ECS_FLAGS,
};

export const SYNCHRONIZERS_FLAGS_EXTRACTORS: Record<ConfigSynchronizer, ExtractorFunction> = {
  Heroku: extractHerokuFlags,
  Vercel: extractVercelFlags,
  Netlify: extractNetlifyFlags,
  Firebase: extractFirebaseFlags,
  AwsLambda: extractAwsLambdaFlags,
  AzureFunctions: extractAzureFunctionsFlags,
  GcpCloudFunctions: extractGcpCloudFunctionsFlags,
  AwsEcs: extractAwsEcsFlags,
};
