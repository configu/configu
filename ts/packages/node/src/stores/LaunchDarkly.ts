import { Config, ConfigStore, ConfigStoreQuery } from '@configu/ts';
import axios, { Axios } from 'axios';
import * as fs from 'fs';

export type LaunchDarklyConfigStoreConfigurations = { apitoken: string; defaultproject: string } | string;

export class LaunchDarklyConfigStore extends ConfigStore {
  private client: Axios;
  private readonly projectKey: string;

  constructor(configurations: LaunchDarklyConfigStoreConfigurations) {
    super('launch-darkly');
    // ldc.json is the default config file name. see https://github.com/launchdarkly-labs/ldc
    const configs =
      typeof configurations === 'string'
        ? JSON.parse(fs.readFileSync('ldc.json').toString())[configurations]
        : configurations;
    this.projectKey = configs.defaultproject;
    this.client = axios.create({
      baseURL: `${configs.server ? configs.server : 'https://app.launchdarkly.com'}/api/v2`,
      headers: {
        Authorization: configs.apitoken,
      },
      responseType: 'json',
    });
  }

  // https://apidocs.launchdarkly.com/tag/Feature-flags#operation/patchFeatureFlag
  private async patchUpdate(config: Config, patchData: Record<string, any>) {
    const { data } = await this.client.patch(`/flags/${this.projectKey}/${config.key}`, patchData, {
      headers: { 'Content-Type': 'application/json; domain-model=launchdarkly.semanticpatch' },
    });
    return data;
  }

  private async getEnvironments(): Promise<string[]> {
    const { data: environments } = await this.client.get(`/projects/${this.projectKey}/environments`);
    return environments.items.map((env: any) => env.key);
  }

  private async getFeatureFlag(config: Config) {
    const { data: featureFlag } = await this.client.get(`/flags/${this.projectKey}/${config.key}`);
    return featureFlag;
  }

  private async createEnvironment(config: Config) {
    await this.client.post(`/projects/${this.projectKey}/environments`, {
      color: 'FFFFFF', // This field is required for creating an environment
      key: config.set,
      name: config.set,
    });
    return config.set;
  }

  private async createFeatureFlag(config: Config) {
    let onValue: any;
    let offValue: any;
    try {
      onValue = JSON.parse(config.value);
      if (typeof onValue === 'boolean') {
        offValue = !onValue;
      } else {
        offValue = Number.isNaN(onValue) ? {} : 0;
      }
    } catch (e) {
      onValue = config.value;
      offValue = '';
    }
    const createData = {
      key: config.key,
      name: config.key,
      variations: [{ value: onValue }, { value: offValue }],
    };
    const { data: featureFlag } = await this.client.post(`/flags/${this.projectKey}`, createData);
    return { featureFlag, onValue };
  }

  private async createVariation(config: Config) {
    let onValue: any;
    try {
      onValue = JSON.parse(config.value);
    } catch (e) {
      onValue = config.value;
    }
    const createVariationData = {
      instructions: [{ kind: 'addVariation', value: onValue }],
    };
    const data = await this.patchUpdate(config, createVariationData);
    return data.variations.find((variation: any) => variation.value === onValue);
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
    const { data: featureFlags } = await this.client.get(`/flags/${this.projectKey}?env=${env}`);
    return featureFlags.items
      .filter((featureFlag: any) => keys.includes(featureFlag.key))
      .map((featureFlag: any) => {
        const onValue = Object.entries(featureFlag.environments[env]._summary.variations)
          .filter((value: [string, any]) => value[1].isFallthrough)
          .map((value) => featureFlag.variations[parseInt(value[0], 10)].value)[0];
        return { key: featureFlag.key, set: env, value: JSON.stringify(onValue) };
      })
      .filter((config: Config) => config.value);
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    if (queries.some((query) => query.set.split('/').length > 1))
      throw new Error('Subsets are not supported in LaunchDarklyConfigStore');
    const environments = await this.getEnvironments();
    const noRootQueries = queries.filter((query) => query.set !== '' && environments.includes(query.set));
    if (noRootQueries[0]) {
      const env = noRootQueries[0].set;
      const keys = noRootQueries.map((value) => value.key);
      return this.getEnvFeatureFlags(env, keys);
    }
    throw new Error('No valid queries');
  }

  async set(configs: Config[]): Promise<void> {
    if (configs.some((config) => config.set === '')) throw new Error('ConfigSet cannot be empty string');
    const environments = await this.getEnvironments();
    const upsertPromises = configs.map(async (config) => {
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
    await Promise.all(upsertPromises);
  }
}
