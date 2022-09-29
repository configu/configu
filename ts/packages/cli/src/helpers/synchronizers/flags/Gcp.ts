import { Flags } from '@oclif/core';
import { GcpCredFlags } from '@configu/lib';
import { FlagsType } from './types';

export const GCP_CRED_FLAGS: FlagsType<GcpCredFlags> = {
  'gcp-key-file': Flags.string({ env: 'GCP_KEY_FILE' }),
};
