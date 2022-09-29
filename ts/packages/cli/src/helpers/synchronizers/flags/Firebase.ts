import { Flags } from '@oclif/core';
import { FirebaseFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const FIREBASE_FLAGS: FlagsType<FirebaseFlags> = {
  'firebase-token': Flags.string({ env: 'FIREBASE_TOKEN', dependsOn: ['firebase-project'] }),
  'firebase-project': Flags.string({ env: 'FIREBASE_PROJECT', dependsOn: ['firebase-token'] }),
};

export const extractFirebaseFlags: ExtractorFunction = ({ flags }) => ({
  project: flags['firebase-project'],
  token: flags['firebase-token'],
});
