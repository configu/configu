import { Config, ConfigStore, ConfigStoreQuery } from '@configu/ts';
import axios, { Axios } from 'axios';
import * as fs from 'fs';
import _ from 'lodash';

export interface LaunchDarklyConfigStoreParams {
  apitoken?: string;
  defaultproject?: string;
  // * https://github.com/launchdarkly-labs/ldc
  ldcJsonPath?: string;
  ldcConfigurationKey?: string;
}

export class LaunchDarklyConfigStore extends ConfigStore {
  private client: Axios;
  private readonly projectKey: string;

  constructor(configurations: LaunchDarklyConfigStoreParams) {
    super('launch-darkly');
    // * ldc.json is the default config file name. see https://github.com/launchdarkly-labs/ldc
    const { ldcJsonPath, ldcConfigurationKey, ...restConfigurations } = configurations;
    const ldcConfigurations =
      ldcJsonPath && ldcConfigurationKey
        ? JSON.parse(fs.readFileSync(ldcJsonPath).toString())[ldcConfigurationKey]
        : {};
    const configs = _.merge(restConfigurations, ldcConfigurations);
    this.projectKey = configs.defaultproject;
    this.client = axios.create({
      baseURL: `${configs.server ? configs.server : 'https://app.launchdarkly.com'}/api/v2`,
      headers: {
        Authorization: configs.apitoken,
      },
      responseType: 'json',
    });
  }

  private async patchUpdate(config: Config, patchData: Record<string, any>) {
    // * https://apidocs.launchdarkly.com/tag/Feature-flags#operation/patchFeatureFlag
    const { data } = await this.client.patch(`/flags/${this.projectKey}/${config.key}`, patchData, {
      headers: { 'Content-Type': 'application/json; domain-model=launchdarkly.semanticpatch' },
    });
    return data;
  }

  private async getEnvironments(): Promise<string[]> {
    // * https://apidocs.launchdarkly.com/tag/Environments#operation/getEnvironmentsByProject
    const { data: environments } = await this.client.get(`/projects/${this.projectKey}/environments`);
    return environments.items.map((env: any) => env.key);
  }

  private async getFeatureFlag(config: Config) {
    // * https://apidocs.launchdarkly.com/tag/Feature-flags#operation/getFeatureFlag
    const { data: featureFlag } = await this.client.get(`/flags/${this.projectKey}/${config.key}`);
    return featureFlag;
  }

  private async createEnvironment(config: Config) {
    // * https://apidocs.launchdarkly.com/tag/Environments#operation/postEnvironment
    await this.client.post(`/projects/${this.projectKey}/environments`, {
      color: 'FFFFFF',
      key: config.set,
      name: config.set,
    });
    return config.set;
  }

  private async createFeatureFlag(config: Config) {
    let fallthroughValue: any;
    let offValue: any;
    try {
      fallthroughValue = JSON.parse(config.value);
      if (typeof fallthroughValue === 'boolean') {
        offValue = !fallthroughValue;
      } else {
        offValue = Number.isNaN(fallthroughValue) ? {} : 0;
      }
    } catch (e) {
      fallthroughValue = config.value;
      offValue = '';
    }
    const createData = {
      key: config.key,
      name: config.key,
      variations: [{ value: fallthroughValue }, { value: offValue }],
    };
    // * https://apidocs.launchdarkly.com/tag/Feature-flags#operation/postFeatureFlag
    const { data: featureFlag } = await this.client.post(`/flags/${this.projectKey}`, createData);
    return { featureFlag, onValue: fallthroughValue };
  }

  private async createVariation(config: Config) {
    let fallthroughValue: any;
    try {
      fallthroughValue = JSON.parse(config.value);
    } catch (e) {
      fallthroughValue = config.value;
    }
    const createVariationData = {
      instructions: [{ kind: 'addVariation', value: fallthroughValue }],
    };
    const data = await this.patchUpdate(config, createVariationData);
    return data.variations.find((variation: any) => variation.value === fallthroughValue);
  }

  private async updateDefaultFallthroughVariation(config: Config, variationId: string) {
    const updateFallthroughVariationData = {
      environmentKey: config.set,
      instructions: [
        {
          kind: 'updateFallthroughVariationOrRollout',
          variationId,
        },
      ],
    };
    return this.patchUpdate(config, updateFallthroughVariationData);
  }

  private async getEnvFeatureFlags(env: string, keys: string[]): Promise<Config[]> {
    // * https://apidocs.launchdarkly.com/tag/Feature-flags#operation/getFeatureFlags
    const { data: featureFlags } = await this.client.get(`/flags/${this.projectKey}?env=${env}&summary=0`);
    return featureFlags.items
      .filter((featureFlag: any) => keys.includes(featureFlag.key))
      .map((featureFlag: any) => {
        const fallthroughIndex = featureFlag.environments[env].fallthrough.variation;
        const fallthroughValue = featureFlag.variations[fallthroughIndex].value;
        const value = typeof fallthroughValue === 'string' ? fallthroughValue : JSON.stringify(fallthroughValue);
        return { key: featureFlag.key, set: env, value };
      })
      .filter((config: Config) => config.value);
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const environments = await this.getEnvironments();
    const getConfigsPromises = _(queries)
      .filter((query) => query.set !== '' && environments.includes(query.set))
      .groupBy('set')
      .map((groupedConfigs) => {
        if (groupedConfigs[0]) {
          return this.getEnvFeatureFlags(groupedConfigs[0].set, _.map(groupedConfigs, 'key'));
        }
        return null;
      })
      .compact()
      .value();

    const getConfigsResults = await Promise.all(getConfigsPromises);
    const storedConfigs = _.flatten(getConfigsResults);

    return storedConfigs;
  }

  async set(configs: Config[]): Promise<void> {
    if (configs.some((config) => config.set === '')) throw new Error('ConfigSet cannot be empty string');
    const environments = await this.getEnvironments();
    const setConfigPromises = configs.map(async (config) => {
      if (!environments.includes(config.set)) {
        environments.push(await this.createEnvironment(config));
      }
      let fallThroughVariation;
      try {
        const featureFlag = await this.getFeatureFlag(config);
        fallThroughVariation =
          featureFlag.variations.find((variation: any) => variation.value === config.value) ||
          (await this.createVariation(config));
      } catch (e) {
        if (e.response.status === 404) {
          const { featureFlag, onValue } = await this.createFeatureFlag(config);
          fallThroughVariation = featureFlag.variations.find((variation: any) => variation.value === onValue);
        } else throw e;
      }
      if (fallThroughVariation) await this.updateDefaultFallthroughVariation(config, fallThroughVariation._id);
    });
    await Promise.all(setConfigPromises);
  }
}
