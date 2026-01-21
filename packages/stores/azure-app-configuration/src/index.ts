import type {
  AppConfigurationClient,
  AppConfigurationClientOptions,
  ConfigurationSetting,
} from '@azure/app-configuration';
import type { DefaultAzureCredentialOptions } from '@azure/identity';
import type { Config, ConfigQuery } from '@configu/sdk';
import { ConfigStore, ConfigStoreConfiguration } from '@configu/sdk';

export type AzureAppConfigurationConfiguration = ConfigStoreConfiguration & {
  endpoint: string;
  credential?: DefaultAzureCredentialOptions;
  options?: AppConfigurationClientOptions;
};

/**
 * Integrates Configu with Azure App Configuration.
 *
 * **Storage Strategy: Label-Based Individual Key Storage**
 * - Maps Configu `set` → Azure App Configuration `label`
 * - Maps Configu `key` → Azure App Configuration `key`
 * - Each config stored as individual configuration
 * - Leverages native label filtering for efficient set-based queries
 *
 * @see https://docs.microsoft.com/azure/azure-app-configuration/
 */
export class AzureAppConfigurationConfigStore extends ConfigStore {
  private client!: AppConfigurationClient;

  constructor(override configuration: AzureAppConfigurationConfiguration) {
    super(configuration);
  }

  override async init() {
    const { AppConfigurationClient } = await import('@azure/app-configuration');
    const { DefaultAzureCredential } = await import('@azure/identity');

    const credential = new DefaultAzureCredential(this.configuration.credential);
    this.client = new AppConfigurationClient(this.configuration.endpoint, credential, this.configuration.options);
  }

  private settingToConfig(setting: ConfigurationSetting): Config {
    return {
      set: setting.label ?? '',
      key: setting.key,
      value: setting.value ?? '',
    };
  }

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    if (queries.length === 0) {
      return [];
    }

    // Group queries by set (label) for efficient batch fetching
    const queryMap = new Map<string, Set<string>>();
    for (const { set, key } of queries) {
      if (!queryMap.has(set)) {
        queryMap.set(set, new Set());
      }
      queryMap.get(set)!.add(key);
    }

    const results: Config[] = [];

    // Fetch configs for each label
    for (const [label, keys] of queryMap.entries()) {
      // Azure App Configuration supports listing with label filter
      const settings = this.client.listConfigurationSettings({
        labelFilter: label,
      });

      for await (const setting of settings) {
        // Only include if this specific key was requested
        if (keys.has(setting.key)) {
          results.push(this.settingToConfig(setting));
        }
      }
    }

    return results;
  }

  async set(configs: Config[]): Promise<void> {
    for (const config of configs) {
      const { set, key, value } = config;

      if (!value) {
        // Delete config if value is empty
        try {
          await this.client.deleteConfigurationSetting({
            key,
            label: set,
          });
        } catch (error: unknown) {
          // Ignore 404 errors (config doesn't exist)
          if (typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode !== 404) {
            throw error;
          }
        }
      } else {
        // Upsert config
        await this.client.setConfigurationSetting({
          key,
          label: set,
          value,
        });
      }
    }
  }
}
