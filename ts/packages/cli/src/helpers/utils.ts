import { cwd } from 'process';
import fs from 'fs/promises';
import path from 'path';
import _ from 'lodash';
import parseJson from 'parse-json';
import yaml from 'js-yaml';

export const { NODE_ENV } = process.env;
export const isDev = NODE_ENV === 'development';

// directory: returns the directory name
// file: return the file name with extension
export const getPathBasename = (fullPath = cwd()) => path.basename(path.resolve(fullPath));

export const getPathBasenameIsomorphic = (fullPath = cwd()) => fullPath.replace(/^.*[/\\]/, '');

export const readFile = async (filePath: string, throwIfEmpty: string | boolean = false) => {
  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, { encoding: 'utf8' });

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

export const readStdin = async () => {
  const { stdin } = process;
  if (stdin.isTTY) {
    return '';
  }
  return new Promise<string>((resolve) => {
    const chunks: Uint8Array[] = [];
    stdin.on('data', (chunk) => {
      chunks.push(chunk);
    });
    stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
};

export const loadJSON = (filePath: string, fileContent: string): any => {
  try {
    return parseJson(fileContent);
  } catch (error) {
    error.message = `JSON Error in ${filePath}:\n${error.message}`;
    throw error;
  }
};

export const loadYAML = (filePath: string, fileContent: string): any => {
  try {
    return yaml.load(fileContent);
  } catch (error) {
    error.message = `YAML Error in ${filePath}:\n${error.message}`;
    throw error;
  }
};
