import { Config } from '../core/Config';
import { ConfigStore, ConfigQuery } from '../core/ConfigStore';

export class NoopConfigStore extends ConfigStore {
  override get(queries: ConfigQuery[]): Promise<Config[]> {
    return Promise.resolve([]);
  }

  override set(configs: Config[]): Promise<void> {
    return Promise.resolve();
  }
}
