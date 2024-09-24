import { ConfigStore, ConfigQuery, Config } from '../core/ConfigStore';

export class NoopConfigStore extends ConfigStore {
  override get(queries: ConfigQuery[]): Promise<Config[]> {
    return Promise.resolve([]);
  }

  override set(configs: Config[]): Promise<void> {
    return Promise.resolve();
  }
}
