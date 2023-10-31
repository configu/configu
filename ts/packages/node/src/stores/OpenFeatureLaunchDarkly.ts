import { type EvaluationContext, OpenFeature } from '@openfeature/server-sdk';
import { LaunchDarklyProvider } from '@launchdarkly/openfeature-node-server';
import { type LDOptions } from '@launchdarkly/node-server-sdk';
import { type ConfigStoreQuery, type Config } from '@configu/ts';
import _ from 'lodash';
import { OpenFeatureConfigStore } from './OpenFeature';

export type OpenFeatureLaunchDarklyConfigStoreConfiguration = {
  sdkKey: string;
  context: EvaluationContext;
  ldOptions?: LDOptions;
};

export class OpenFeatureLaunchDarklyConfigStore extends OpenFeatureConfigStore {
  constructor(configurations: OpenFeatureLaunchDarklyConfigStoreConfiguration) {
    const { sdkKey, ldOptions, context } = configurations;
    if (_.isEmpty(context) || !['targetingKey', 'key'].some((value) => Object.keys(context).includes(value)))
      throw new Error(
        `The EvaluationContext must contain either a 'targetingKey' or a 'key' and the type must be a string.`,
      );
    const ldOptionsWithStream = { ...ldOptions, stream: false };
    super('open-feature-launch-darkly', {
      provider: new LaunchDarklyProvider(sdkKey, ldOptionsWithStream),
      context,
    });
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const configs = super.get(queries);
    await OpenFeature.close();
    return configs;
  }
}
