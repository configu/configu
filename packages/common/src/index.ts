import { ConfigStore } from '@configu/sdk';
import { JsonFileConfigStore } from '@configu-integrations/json-file';
import { ConfiguConfigStore } from '@configu-integrations/configu';

import '@configu/expressions';

ConfigStore.register(JsonFileConfigStore);

export { ConfiguConfigStoreApprovalQueueError } from '@configu-integrations/configu';
ConfigStore.register(ConfiguConfigStore);

// import './test';

export * from './utils';

export * from './ConfiguFile';
export * from './CfguFile';
