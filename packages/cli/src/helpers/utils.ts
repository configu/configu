import * as os from 'os';
import * as fs from 'fs';
import path from 'path';

export const { NODE_ENV } = process.env;
export const isDev = NODE_ENV === 'development';
export const configuStoreType = 'configu';

// Mimics configDir from oclif for backward compatibility
export const getConfigDir = (): string => {
  if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;

  const baseDir = process.platform === 'win32' ? (process.env.LOCALAPPDATA ?? os.homedir()) : os.homedir();

  if (!baseDir) {
    throw new Error('Unable to determine the base directory for config files');
  }

  const configDir = path.join(baseDir, '.configu');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  return configDir;
};
