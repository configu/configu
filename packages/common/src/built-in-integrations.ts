import validators from '@configu-integrations/validator';
import { JsonFileConfigStore } from '@configu-integrations/json-file';
import { ConfiguConfigStore } from '@configu-integrations/configu';
import { NoopConfigStore, InMemoryConfigStore } from '@configu/sdk';

import { Registry } from './Registry';

Registry.register({
  ...validators.default,
  NoopConfigStore,
  InMemoryConfigStore,
  ConfiguConfigStore,
  JsonFileConfigStore,
});
