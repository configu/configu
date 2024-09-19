import { ConfiguFile } from '@configu/common';
import { config } from './config';

const getConfiguFile = async () => {
  if (config.CONFIGU_CONFIG_FILE) {
    return ConfiguFile.loadFromPath(config.CONFIGU_CONFIG_FILE);
  }
  return ConfiguFile.loadFromSearch();
};

export { getConfiguFile };
