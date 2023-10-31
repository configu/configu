import { type EvaluationContext } from '@openfeature/server-sdk';
import { CloudbeesProvider } from 'cloudbees-openfeature-provider-node';
import { type RoxSetupOptions } from 'rox-node';
import { OpenFeatureConfigStore } from './OpenFeature';

export type OpenFeatureCloudBeesConfigStoreConfiguration = {
  appKey: string;
  providerOptions?: RoxSetupOptions;
  context?: EvaluationContext;
};

export class OpenFeatureCloudBeesConfigStore extends OpenFeatureConfigStore {
  constructor(configuration: OpenFeatureCloudBeesConfigStoreConfiguration) {
    const { appKey, providerOptions, context } = configuration;
    super('open-feature-cloud-bees', {
      provider: CloudbeesProvider.build(appKey, {
        ...providerOptions,
        fetchIntervalInSec: 0,
      }),
      context,
    });
  }
}
