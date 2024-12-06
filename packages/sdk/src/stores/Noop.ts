import { Config } from '../Config';
import { ConfigStore, ConfigQuery } from '../ConfigStore';

export class NoopConfigStore extends ConfigStore {
  override get(queries: ConfigQuery[]): Promise<Config[]> {
    return Promise.resolve([]);
  }

  override set(configs: Config[]): Promise<void> {
    return Promise.resolve();
  }
}
