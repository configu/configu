import * as validators from '@configu-integrations/validator';
import { CompactJSON } from '@configu-integrations/compact-json';
import { JSONExpression } from '@configu-integrations/json';
import { Dotenv } from '@configu-integrations/dotenv';
import { TOML } from '@configu-integrations/toml';
import { JsonFileConfigStore } from '@configu-integrations/json-file';
import { ConfiguConfigStore } from '@configu-integrations/configu';
import { NoopConfigStore, InMemoryConfigStore } from '@configu/sdk';

import { Registry } from './Registry';

Registry.register(validators);
Registry.register({
  CompactJSON,
  JSONExpression,
  Dotenv,
  TOML,
  NoopConfigStore,
  InMemoryConfigStore,
  ConfiguConfigStore,
  JsonFileConfigStore,
});
