import { EvaluatedConfigs } from '@configu/ts';
import { ConfigSynchronizer } from '@configu/lib';

import { SYNCHRONIZERS_FLAGS_EXTRACTORS, ParsedFlagsType } from './flags';
import { SYNCHRONIZERS_HANDLERS } from './logic';

export { SYNCHRONIZERS_FLAGS_DICT } from './flags';

export const syncIntegration = async ({
  synchronizer,
  flags,
  configs,
}: {
  synchronizer: ConfigSynchronizer;
  flags: ParsedFlagsType;
  configs: EvaluatedConfigs;
}) => {
  const extractor = SYNCHRONIZERS_FLAGS_EXTRACTORS[synchronizer];
  const handler = SYNCHRONIZERS_HANDLERS[synchronizer];
  if (!extractor || !handler) {
    throw new Error(`${synchronizer} is not supported`);
  }
  const configuration = extractor({ flags });
  return handler({ configuration, configs });
};
