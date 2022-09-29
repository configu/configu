import { Flags } from '@oclif/core';
import { AzureCredFlags } from '@configu/lib';
import { FlagsType } from './types';

export const AZURE_CRED_FLAGS: FlagsType<AzureCredFlags> = {
  'azure-tenant-id': Flags.string({
    env: 'AZURE_TENANT_ID',
    dependsOn: ['azure-client-id', 'azure-client-secret'],
  }),
  'azure-client-id': Flags.string({
    env: 'AZURE_CLIENT_ID',
    dependsOn: ['azure-tenant-id', 'azure-client-secret'],
  }),
  'azure-client-secret': Flags.string({
    env: 'AZURE_CLIENT_SECRET',
    dependsOn: ['azure-client-id', 'azure-tenant-id'],
  }),
};
