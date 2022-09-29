import { Flags } from '@oclif/core';
import { AzureFunctionsSpecificFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const AZURE_FUNCTIONS_FLAGS: FlagsType<AzureFunctionsSpecificFlags> = {
  'azure-subscription-id': Flags.string({
    env: 'AZURE_SUBSCRIPTION_ID',
    dependsOn: [
      'azure-client-id',
      'azure-client-secret',
      'azure-tenant-id',
      'azure-resource-group',
      'azure-function-app',
    ],
  }),
  'azure-resource-group': Flags.string({
    env: 'AZURE_RESOURCE_GROUP',
    dependsOn: [
      'azure-client-id',
      'azure-client-secret',
      'azure-tenant-id',
      'azure-subscription-id',
      'azure-function-app',
    ],
  }),
  'azure-function-app': Flags.string({
    env: 'AZURE_FUNCTION_APP',
    dependsOn: [
      'azure-client-id',
      'azure-client-secret',
      'azure-tenant-id',
      'azure-subscription-id',
      'azure-resource-group',
    ],
  }),
};

export const extractAzureFunctionsFlags: ExtractorFunction = ({ flags }) => ({
  tenantId: flags['azure-tenant-id'],
  clientId: flags['azure-client-id'],
  clientSecret: flags['azure-client-secret'],
  subscriptionId: flags['azure-subscription-id'],
  resourceGroupName: flags['azure-resource-group'],
  functionApp: flags['azure-function-app'],
});
