export type Runtime =
  | 'Heroku'
  | 'Vercel'
  | 'Netlify'
  | 'Firebase'
  | 'AwsLambda'
  | 'AzureFunctions'
  | 'GcpCloudFunctions'
  | 'AwsEcs';

export const RUNTIME_LABEL: Record<Runtime, string> = {
  Heroku: 'Heroku',
  Vercel: 'Vercel',
  Netlify: 'Netlify',
  Firebase: 'Firebase',
  AwsLambda: 'AWS Lambda',
  AzureFunctions: 'Azure Functions',
  GcpCloudFunctions: 'GCP Cloud Functions',
  AwsEcs: 'AWS ECS',
};

export const RUNTIME_WEBSITE: Record<Runtime, string> = {
  Heroku: 'https://www.heroku.com/',
  Vercel: 'https://vercel.com/',
  Netlify: 'https://netlify.com/',
  Firebase: 'https://firebase.google.com/',
  AwsLambda: 'https://aws.amazon.com/lambda/',
  AzureFunctions: 'https://azure.microsoft.com/en-us/services/functions/',
  GcpCloudFunctions: 'https://cloud.google.com/functions',
  AwsEcs: 'https://aws.amazon.com/ecs/',
};

export const RUNTIME_TYPE = Object.keys(RUNTIME_LABEL) as Runtime[];
