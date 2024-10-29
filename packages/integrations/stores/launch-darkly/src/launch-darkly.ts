import { type EvaluationContext, OpenFeature } from '@openfeature/server-sdk';
import { LaunchDarklyProvider } from '@launchdarkly/openfeature-node-server';
import { type LDOptions } from '@launchdarkly/node-server-sdk';
import { type ConfigQuery, type Config } from '@configu/sdk';
import _ from 'lodash-es';
import { OpenFeatureConfigStore } from '@configu/integrations/src/utils/OpenFeature';

export type LaunchDarklyConfigStoreConfiguration = {
  sdkKey: string;
  context: EvaluationContext;
  ldOptions?: LDOptions;
};

export class LaunchDarklyConfigStore extends OpenFeatureConfigStore {
  constructor(configurations: LaunchDarklyConfigStoreConfiguration) {
    const { sdkKey, ldOptions, context } = configurations;
    if (_.isEmpty(context) || !['targetingKey', 'key'].some((value) => Object.keys(context).includes(value)))
      throw new Error(
        `The EvaluationContext must contain either a 'targetingKey' or a 'key' and the type must be a string.`,
      );
    // * stream is set to true by default, but we want to close the connection after each request
    const ldOptionsWithoutStream = { ...ldOptions, stream: false };
    super({
      provider: new LaunchDarklyProvider(sdkKey, ldOptionsWithoutStream),
      context,
    });
  }

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    const configs = await super.get(queries);
    await OpenFeature.close();
    return configs;
  }
}
