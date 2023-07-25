import { Config, ConfigStore, ConfigStoreQuery } from '@configu/ts';
import axios, { Axios } from 'axios';
import assert from 'node:assert';
import * as fs from 'fs';

export type LaunchDarklyConfigStoreConfigurations = { apitoken: string; defaultproject: string } | string;

export class LaunchDarklyConfigStore extends ConfigStore {
  private client: Axios;
  private readonly projectKey: string;
  private environments: string[];

  constructor(configurations: LaunchDarklyConfigStoreConfigurations) {
    super('launch-darkly');
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
    this.environments = [];
  }

  private async patchUpdate(config: Config, patchData: Record<string, any>) {
    const { data } = await this.client.patch(`/flags/${this.projectKey}/${config.key}`, patchData, {
      headers: { 'Content-Type': 'application/json; domain-model=launchdarkly.semanticpatch' },
    });
    return data;
  }

  private async updateEnvironments() {
    const { data: environments } = await this.client.get(`/projects/${this.projectKey}/environments`);
    this.environments = [...this.environments, ...environments.items.map((env: any) => env.key)];
  }

  private async getFeatureFlag(config: Config) {
    const { data: featureFlag } = await this.client.get(`/flags/${this.projectKey}/${config.key}`);
    return featureFlag;
  }

  private async createEnvironment(config: Config) {
    await this.client.post(`/projects/${this.projectKey}/environments`, {
      color: 'FFFFFF',
      key: config.set,
      name: config.set,
    });
    this.environments = [...this.environments, config.set];
  }

  private async createFeatureFlag(config: Config) {
    const createData = {
      clientSideAvailability: {
        usingEnvironmentId: true,
        usingMobileKey: true,
      },
      key: config.key,
      name: config.key,
      variations: [{ value: config.value }, { value: '' }],
    };
    const { data: featureFlag } = await this.client.post(`/flags/${this.projectKey}`, createData);
    return featureFlag;
  }

  private async createVariation(config: Config) {
    const createVariationData = {
      instructions: [{ kind: 'addVariation', value: config.value }],
    };
    const data = await this.patchUpdate(config, createVariationData);
    return data.variations.find((variation: any) => variation.value === config.value);
  }

  private async updateDefaultFallthroughVariation(config: Config, variationId: string) {
    const updateDefaultVariationData = {
      instructions: [
        {
          kind: 'updateDefaultVariation',
          OnVariationValue: config.value,
          OffVariationValue: '',
        },
      ],
    };
    const updateFallthroughVariationData = {
      environmentKey: config.set,
      instructions: [
        {
          kind: 'updateFallthroughVariationOrRollout',
          variationId,
        },
      ],
    };
    await this.patchUpdate(config, updateDefaultVariationData);
    return this.patchUpdate(config, updateFallthroughVariationData);
  }

  private async upsert(config: Config) {
    if (!this.environments.includes(config.set)) {
      await this.createEnvironment(config);
    }
    let featureFlag;
    try {
      featureFlag = await this.getFeatureFlag(config);
      const existingVariation =
        featureFlag.variations.find((variation: any) => variation.value === config.value) ||
        (await this.createVariation(config));
      if (existingVariation) featureFlag = await this.updateDefaultFallthroughVariation(config, existingVariation._id);
    } catch (e) {
      if (e.response.status === 404) featureFlag = await this.createFeatureFlag(config);
      else throw e;
    }
    if (featureFlag && !featureFlag.environments[config.set].on) {
      const onData = {
        environmentKey: config.set,
        instructions: [{ kind: 'turnFlagOn' }],
      };
      await this.patchUpdate(config, onData);
    }
  }

  private async validateQueries(queries: ConfigStoreQuery[]): Promise<[string, string[]]> {
    await this.updateEnvironments();
    queries.forEach((query) => {
      assert(query.set.split('/').length === 1, 'Subsets are not supported in LaunchDarklyStore');
    });
    const noRootQueries = queries.filter((query) => query.set !== '' && this.environments.includes(query.set));
    if (noRootQueries[0]) {
      const env = noRootQueries[0].set;
      const keys = noRootQueries.map((value) => value.key);
      return [env, keys];
    }
    throw new Error('No valid queries');
  }

  private assertNotSettingToRoot(configs: Config[]) {
    assert.strictEqual(
      configs.some((config) => config.set === ''),
      false,
      'ConfigSet cannot be empty string',
    );
  }

  private async getEnvFeatureFlags(env: string, keys: string[]): Promise<Config[]> {
    const { data: featureFlags } = await this.client.get(`/flags/${this.projectKey}?env=${env}`);
    return featureFlags.items
      .filter((featureFlag: any) => keys.includes(featureFlag.key))
      .map((featureFlag: any) => {
        const onValue = Object.entries(featureFlag.environments[env]._summary.variations)
          .filter((value: [string, any]) => value[1].isFallthrough)
          .map((value) => featureFlag.variations[parseInt(value[0], 10)].value)[0];
        return { key: featureFlag.key, set: env, value: featureFlag.environments[env].on ? onValue : '' };
      });
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    try {
      const [env, keys] = await this.validateQueries(queries);
      return this.getEnvFeatureFlags(env, keys);
    } catch (e) {
      return [];
    }
  }

  async set(configs: Config[]): Promise<void> {
    this.assertNotSettingToRoot(configs);
    await this.updateEnvironments();
    configs.forEach(this.upsert.bind(this));
  }
}
