import { ConfigStore } from '@configu/sdk';

import { JsonFileConfigStore } from '@configu/json-file';
import { ConfiguConfigStore } from '@configu/configu';

ConfigStore.register(JsonFileConfigStore);
ConfigStore.register(ConfiguConfigStore);

export { ConfiguConfigStoreApprovalQueueError } from '@configu/configu';

export * from './utils';

export * from './ConfiguFile';
export * from './CfguFile';

export * from './ConfiguInterface';
