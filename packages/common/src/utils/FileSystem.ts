import process from 'node:process';
import os from 'node:os';
import fs from 'node:fs/promises';
import { _ } from '@configu/sdk';
import { debug } from './OutputStreams';
import { path, stdenv, JSON, YAML } from './Misc';

export const CONFIGU_DEFAULT_HOME_DIR = path.join(os.homedir(), '.configu');
export const CONFIGU_HOME = path.resolve(stdenv.env.CONFIGU_HOME ?? CONFIGU_DEFAULT_HOME_DIR);

if (CONFIGU_HOME !== CONFIGU_DEFAULT_HOME_DIR) {
  debug('Using custom CONFIGU_HOME:', CONFIGU_HOME);
}

export const CONFIGU_PATHS = {
  home: CONFIGU_HOME,
  cache: path.join(CONFIGU_HOME, 'cache'),
  bin: path.join(CONFIGU_HOME, 'bin'),
};

export const readFile = async (
  filePath: string,
  {
    throwIfEmpty = false,
    throwIfNotFound = true,
  }: {
    throwIfEmpty?: boolean | string;
    throwIfNotFound?: boolean;
  } = {},
) => {
  try {
    const absolutePath = path.resolve(filePath);
    debug('Reading file:', absolutePath);
    const content = await fs.readFile(absolutePath, { encoding: 'utf-8' });

    if (throwIfEmpty && _.isEmpty(content)) {
      const errorMessage = typeof throwIfEmpty !== 'boolean' ? throwIfEmpty : 'file is empty';
      throw new Error(errorMessage);
    }

    return content;
  } catch (error) {
    // todo: replace with https://nodejs.org/api/util.html#utilgetsystemerrormessageerr after upgrading to Node.js above v23.1.0
    // * https://nodejs.org/api/errors.html#errors_common_system_errors
    if (throwIfNotFound && error.code === 'ENOENT') {
      throw new Error('no such file or directory');
    }
    if (error.code === 'EISDIR') {
      throw new Error('expected a file, but the given path was a directory');
    }

    if (!throwIfNotFound && error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
};

// directory: returns the directory name
// file: return the file name with extension
export const getPathBasename = (fullPath = process.cwd()) => path.basename(path.resolve(fullPath));

export const parseJsonFile = (filePath: string, fileContent: string): any => {
  try {
    return JSON.parse(fileContent);
  } catch (error) {
    error.message = `JSON Error in ${filePath}:\n${error.message}`;
    throw error;
  }
};

export const parseYamlFile = (filePath: string, fileContent: string): any => {
  try {
    return YAML.parse(fileContent);
  } catch (error) {
    error.message = `YAML Error in ${filePath}:\n${error.message}`;
    throw error;
  }
};
