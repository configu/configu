import { ConfigStore } from '@configu/sdk';

import { JsonFileConfigStore } from '@configu-integrations/json-file';
import { ConfiguConfigStore } from '@configu-integrations/configu';

ConfigStore.register(JsonFileConfigStore);
ConfigStore.register(ConfiguConfigStore);

export { ConfiguConfigStoreApprovalQueueError } from '@configu-integrations/configu';

export * from './utils';

export * from './ConfiguFile';
export * from './CfguFile';

export * from './ConfiguInterface';
