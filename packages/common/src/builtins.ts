import { ConfigStore } from '@configu/sdk';
import { NoopConfigStore, InMemoryConfigStore } from '@configu/sdk/stores';
import { JsonFileConfigStore } from '@configu/json-file';
import { ConfiguConfigStore } from '@configu/configu';

ConfigStore.register(NoopConfigStore);
ConfigStore.register(InMemoryConfigStore);
ConfigStore.register(JsonFileConfigStore);
ConfigStore.register(ConfiguConfigStore);

export { ConfiguConfigStoreApprovalQueueError } from '@configu/configu';
