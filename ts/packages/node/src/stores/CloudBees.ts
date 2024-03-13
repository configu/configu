import { type EvaluationContext } from '@openfeature/server-sdk';
import { CloudbeesProvider } from 'cloudbees-openfeature-provider-node';
import { type RoxSetupOptions } from 'rox-node';
import { OpenFeatureConfigStore } from './OpenFeature';

export type CloudBeesConfigStoreConfiguration = {
  appKey: string;
  providerOptions?: RoxSetupOptions;
  context?: EvaluationContext;
};

export class CloudBeesConfigStore extends OpenFeatureConfigStore {
  constructor(configuration: CloudBeesConfigStoreConfiguration) {
    const { appKey, providerOptions, context } = configuration;
    super('cloud-bees', {
      provider: CloudbeesProvider.build(appKey, {
        ...providerOptions,
        fetchIntervalInSec: 0, // * force the client to close the connection after each request
      }),
      context,
    });
  }
}
