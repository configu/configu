import { ConfigStore, NoopConfigStore, InMemoryConfigStore } from '@configu/sdk';
import { JsonFileConfigStore } from '@configu/json-file';
import { ConfiguPlatformConfigStore } from '@configu/configu-platform';

ConfigStore.register(NoopConfigStore);
ConfigStore.register(InMemoryConfigStore);
ConfigStore.register(JsonFileConfigStore);
ConfigStore.register(ConfiguPlatformConfigStore);
