import { Flags } from '@oclif/core';
import { NetlifyFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const NETLIFY_FLAGS: FlagsType<NetlifyFlags> = {
  'netlify-token': Flags.string({ env: 'NETLIFY_TOKEN', dependsOn: ['netlify-site-id'] }),
  'netlify-site-id': Flags.string({ env: 'NETLIFY_SITE_ID', dependsOn: ['netlify-token'] }),
};

export const extractNetlifyFlags: ExtractorFunction = ({ flags }) => ({
  token: flags['netlify-token'],
  siteId: flags['netlify-site-id'],
});
