import { Flags } from '@oclif/core';
import { AwsLambdaSpecificFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const AWS_LAMBDA_FLAGS: FlagsType<AwsLambdaSpecificFlags> = {
  'aws-function-name': Flags.string({
    env: 'AWS_FUNCTION_NAME',
    dependsOn: ['aws-access-key-id', 'aws-secret-access-key', 'aws-region'],
  }),
};

export const extractAwsLambdaFlags: ExtractorFunction = ({ flags }) => ({
  accessKeyId: flags['aws-access-key-id'],
  secretAccessKey: flags['aws-secret-access-key'],
  region: flags['aws-region'],
  functionName: flags['aws-function-name'],
  ...(flags['aws-endpoint'] && { endpoint: flags['aws-endpoint'] }),
});
