import { ConfigStore, type ConfigStoreQuery, type Config } from '@configu/ts';
import {
  OpenFeature,
  type EvaluationContext,
  type Client,
  type Provider,
  type EvaluationDetails,
} from '@openfeature/server-sdk';

export type OpenFeatureConfigStoreConfiguration = {
  provider: Provider | Promise<Provider>;
  context?: EvaluationContext;
};

export abstract class OpenFeatureConfigStore extends ConfigStore {
  protected readonly provider: Provider | Promise<Provider>;
  private readonly client: Client;

  protected constructor(type: string, configuration: OpenFeatureConfigStoreConfiguration) {
    super(type);
    const { provider, context = {} } = configuration;
    this.provider = provider;
    this.client = OpenFeature.getClient(context);
  }

  async init(): Promise<void> {
    await OpenFeature.setProviderAndWait(await this.provider);
  }

  private async getValue(key: string, set: string, valueType: string = 'bool'): Promise<string> {
    let details: EvaluationDetails<any>;
    switch (valueType) {
      case 'bool':
        details = await this.client.getBooleanDetails(key, false, { ...this.client.getContext(), set });
        if (details.errorCode === 'FLAG_NOT_FOUND') return '';
        if (details.errorCode === 'TYPE_MISMATCH') return this.getValue(key, set, 'number');
        return String(details.value);
      case 'number':
        details = await this.client.getNumberDetails(key, 0, { ...this.client.getContext(), set });
        if (details.errorCode === 'TYPE_MISMATCH') return this.getValue(key, set, 'string');
        return String(details.value);
      case 'string':
        details = await this.client.getStringDetails(key, '', { ...this.client.getContext(), set });
        if (details.errorCode === 'TYPE_MISMATCH') return this.getValue(key, set, 'object');
        return details.value;
      case 'object':
        details = await this.client.getObjectDetails(key, {}, { ...this.client.getContext(), set });
        if (details.errorCode === 'TYPE_MISMATCH') return this.getValue(key, set, '');
        return JSON.stringify(details.value);
      default:
        return '';
    }
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const queryPromises = queries.map(async ({ set, key }) => {
      const value = await this.getValue(key, set);
      return { set, key, value };
    });
    const configs = await Promise.all(queryPromises);
    return configs.filter((config) => config.value !== '');
  }

  set(configs: Config[]): Promise<void> {
    throw new Error(`${this.constructor.name} doesn't support the "set" method`);
  }
}
