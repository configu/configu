import { ConfigStore, NoopConfigStore, InMemoryConfigStore } from '@configu/sdk';
import { JsonFileConfigStore } from '@configu/json-file';
import { ConfiguConfigStore } from '@configu/configu';

ConfigStore.register(NoopConfigStore);
ConfigStore.register(InMemoryConfigStore);
ConfigStore.register(JsonFileConfigStore);
ConfigStore.register(ConfiguConfigStore);
