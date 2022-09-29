import { Flags } from '@oclif/core';
import { GcpCloudFunctionsSpecificFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const GCP_CLOUD_FUNCTIONS_FLAGS: FlagsType<GcpCloudFunctionsSpecificFlags> = {
  'gcp-cloud-function-name': Flags.string({ env: 'GCP_CLOUD_FUNCTION_NAME', dependsOn: ['gcp-key-file'] }),
};

export const extractGcpCloudFunctionsFlags: ExtractorFunction = ({ flags }) => ({
  keyFile: flags['gcp-key-file'],
  functionName: flags['gcp-cloud-function-name'],
});
