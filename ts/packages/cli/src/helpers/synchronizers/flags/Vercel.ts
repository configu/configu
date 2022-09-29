import { Flags } from '@oclif/core';
import { VercelFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const VERCEL_FLAGS: FlagsType<VercelFlags> = {
  'vercel-token': Flags.string({ env: 'VERCEL_TOKEN', dependsOn: ['vercel-app-uid'] }),
  'vercel-app-uid': Flags.string({ env: 'VERCEL_APP_UID', dependsOn: ['vercel-token'] }),
};

export const extractVercelFlags: ExtractorFunction = ({ flags }) => ({
  token: flags['vercel-token'],
  appUid: flags['vercel-app-uid'],
});
