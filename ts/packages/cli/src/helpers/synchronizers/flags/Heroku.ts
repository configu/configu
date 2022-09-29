import { Flags } from '@oclif/core';
import { HerokuFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const HEROKU_FLAGS: FlagsType<HerokuFlags> = {
  'heroku-token': Flags.string({ env: 'HEROKU_TOKEN', dependsOn: ['heroku-app-uid'] }),
  'heroku-app-uid': Flags.string({ env: 'HEROKU_APP_UID', dependsOn: ['heroku-token'] }),
};

export const extractHerokuFlags: ExtractorFunction = ({ flags }) => ({
  token: flags['heroku-token'],
  appUid: flags['heroku-app-uid'],
});
