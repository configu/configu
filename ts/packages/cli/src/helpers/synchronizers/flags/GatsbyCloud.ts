import { Flags } from '@oclif/core';
import { GatsbyCloudFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const GATSBY_CLOUD_FLAGS: FlagsType<GatsbyCloudFlags> = {
  'gatsby-cloud-token': Flags.string({ env: 'GATSBY_CLOUD_TOKEN', dependsOn: ['gatsby-cloud-site-id'] }),
  'gatsby-cloud-site-id': Flags.string({ env: 'GATSBY_CLOUD_SITE_ID', dependsOn: ['gatsby-cloud-token'] }),
};

export const extractGatsbyCloudFlags: ExtractorFunction = ({ flags }) => ({
  token: flags['gatsby-cloud-token'],
  siteId: flags['gatsby-cloud-site-id'],
});
