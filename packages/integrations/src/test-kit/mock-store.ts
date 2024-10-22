import { Config, ConfigQuery, ConfigStore } from '@configu/sdk';
import test from 'node:test';

export class MockStore extends ConfigStore {
  get: any = test.mock.fn<(queries: ConfigQuery[]) => Promise<Config[]>>(async () => []);
  set: any = test.mock.fn<(configs: Config[]) => Promise<void>>();

  get getMock() {
    return this.get.mock;
  }

  get setMock() {
    return this.set.mock;
  }
}
