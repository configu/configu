import * as os from 'os';
import * as fs from 'fs';
import path from 'path';

export const { NODE_ENV } = process.env;
export const isDev = NODE_ENV === 'development';

// Mimics configDir from oclif for backward compatibility
export const getConfigDir = (): string => {
  if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;

  // Use LOCALAPPDATA on Windows, otherwise default to home directory
  // TODO: find a better way (ref: https://github.com/oclif/core/blob/main/src/config/config.ts#L337C8-L337C75)
  const baseDir = process.platform === 'win32' ? process.env.LOCALAPPDATA : os.homedir();

  if (!baseDir) {
    throw new Error('Unable to determine the base directory for config files');
  }

  const configDir = path.join(baseDir, '.configu');

  // Ensure the config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  return configDir;
};
