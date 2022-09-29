import { Flags } from '@oclif/core';
import { AwsCredFlags } from '@configu/lib';
import { FlagsType } from './types';

export const AWS_CRED_FLAGS: FlagsType<AwsCredFlags> = {
  'aws-access-key-id': Flags.string({ env: 'AWS_ACCESS_KEY_ID', dependsOn: ['aws-secret-access-key'] }),
  'aws-secret-access-key': Flags.string({
    env: 'AWS_SECRET_ACCESS_KEY',
    dependsOn: ['aws-access-key-id'],
  }),
  'aws-region': Flags.string({ env: 'AWS_DEFAULT_REGION', dependsOn: ['aws-access-key-id', 'aws-secret-access-key'] }),
  'aws-endpoint': Flags.string({
    description: '(optional) in case AWS client has a special route', // this is basically for local testing
    dependsOn: ['aws-access-key-id', 'aws-secret-access-key'],
    exclusive: ['aws-region'],
    hidden: true,
  }),
};
