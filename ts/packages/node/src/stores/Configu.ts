import {
  ConfiguConfigStore as BaseConfiguConfigStore,
  ConfiguConfigStoreConfiguration as BaseConfiguConfigStoreConfiguration,
} from '@configu/ts';

export type ConfiguConfigStoreConfiguration = BaseConfiguConfigStoreConfiguration;

export class ConfiguConfigStore extends BaseConfiguConfigStore {
  constructor(configuration: ConfiguConfigStoreConfiguration) {
    const credentials = {
      org: configuration.credentials.org ?? process.env.CONFIGU_ORG,
      token: configuration.credentials.token ?? process.env.CONFIGU_TOKEN,
    };

    super({ ...configuration, credentials });
  }
}
