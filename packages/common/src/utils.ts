import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'pathe';

import _ from 'lodash';
import parseJson from 'parse-json';
import YAML from 'yaml';
import { tsImport } from 'tsx/esm/api';
import * as stdenv from 'std-env';
import { glob } from 'glob';
import { findUp, findUpMultiple, pathExists } from 'find-up';
import logger from './logger';

export { path, findUp, findUpMultiple, pathExists, glob, stdenv, YAML };

export const getConfiguHomeDir = async (...paths: string[]): Promise<string> => {
  const directory = path.join(os.homedir(), '.configu', ...paths);
  await fs.mkdir(directory, { recursive: true });
  return directory;
};

export const readFile = async (filePath: string, throwIfEmpty: string | boolean = false) => {
  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, { encoding: 'utf-8' });

    if (throwIfEmpty && _.isEmpty(content)) {
      const errorMessage = typeof throwIfEmpty !== 'boolean' ? throwIfEmpty : 'file is empty';
      throw new Error(errorMessage);
    }

    return content;
  } catch (error) {
    // * https://nodejs.org/api/errors.html#errors_common_system_errors
    if (error.code === 'ENOENT') {
      throw new Error('no such file or directory');
    }
    if (error.code === 'EISDIR') {
      throw new Error('expected a file, but the given path was a directory');
    }

    throw error;
  }
};

export const importModule = async (modulePath: string = '') => {
  // const module = await import(modulePath);
  let module;
  if (modulePath.endsWith('.ts')) {
    logger.log('Import TS file');
    module = await tsImport(modulePath, import.meta.url);
  } else {
    logger.log('import using native import');
    module = await import(modulePath);
  }
  return module;
};

// export const readStdin = async () => {
//   const { stdin } = process;
//   if (stdin.isTTY) {
//     return '';
//   }
//   return new Promise<string>((resolve) => {
//     const chunks: Uint8Array[] = [];
//     stdin.on('data', (chunk) => {
//       chunks.push(chunk);
//     });
//     stdin.on('end', () => {
//       resolve(Buffer.concat(chunks).toString('utf8'));
//     });
//   });
// };

export const parseJSON = (filePath: string, fileContent: string): any => {
  try {
    return parseJson(fileContent);
  } catch (error) {
    error.message = `JSON Error in ${filePath}:\n${error.message}`;
    throw error;
  }
};

export const parseYAML = (filePath: string, fileContent: string): any => {
  try {
    return YAML.parse(fileContent);
  } catch (error) {
    error.message = `YAML Error in ${filePath}:\n${error.message}`;
    throw error;
  }
};

// console.log(process.cwd());
// console.log(await glob('file://tsconfig.json'));
// console.log(new URL('file://a/b/c/*.cfgu.json'));
// console.log(path.resolve('/a/b/c'));
// console.log(path.resolve('file://a/b/c'));
