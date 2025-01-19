import os from 'node:os';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { fileURLToPath, URL } from 'node:url';
import path from 'pathe';
import * as environment from 'std-env';
import { validator, _ } from '@configu/sdk';
import configuSdkPackageJson from '@configu/sdk/package.json';
import { consola, LogLevels, ConsolaInstance } from 'consola';
import axios from 'axios';
import parseJson from 'parse-json';
import YAML from 'yaml';
import { createJiti } from 'jiti';
import { glob } from 'glob';
import semver from 'semver';
import { findUp, findUpMultiple, pathExists } from 'find-up';
import { downloadTemplate } from 'giget';
import npm from 'npm';

// general
export const configuRemotePackagesUri = `github:configu/configu`;
export const configuSdkPackageUri = `${configuRemotePackagesUri}/${configuSdkPackageJson.repository.directory}`;

export { path, findUp, findUpMultiple, pathExists, glob, semver, environment, YAML };

const parseBoolean = (value: string) => validator.toBoolean(value, true);

// debug
const print = process.stdout.write.bind(process.stdout);
// we replace stdout with stderr to avoid errors thrown by interfaces like clipanion being captured by the shell and disrupt stdout pipe functionality
process.stdout.write = process.stderr.write.bind(process.stderr);

interface ConsoleInstance extends ConsolaInstance {
  print: typeof print;
}
export const console = consola as ConsoleInstance;
console.print = print;

const CONFIGU_DEBUG =
  ['configu', 'true', '*'].includes(environment.env.DEBUG ?? 'false') ||
  parseBoolean(environment.env.CONFIGU_DEBUG ?? environment.env.DEBUG ?? 'false');
console.level = environment.env.CONFIGU_LOG_LEVEL ? parseInt(environment.env.CONFIGU_LOG_LEVEL, 10) : LogLevels.info;
if (CONFIGU_DEBUG && console.level < LogLevels.debug) {
  console.level = LogLevels.debug;
}
console.options.stdout = process.stderr;
console.options.stderr = process.stderr;

console.debug('CONFIGU_LOG_LEVEL:', console.level);
console.debug('CONFIGU_DEBUG:', CONFIGU_DEBUG);

// http
// eslint-disable-next-line import/no-mutable-exports
export let CONFIGU_API_URL = environment.env.CONFIGU_API_URL ?? 'https://api.configu.com';
// eslint-disable-next-line import/no-mutable-exports
export let CONFIGU_APP_URL = environment.env.CONFIGU_APP_URL ?? 'https://app.configu.com';
if (environment.isDevelopment) {
  CONFIGU_API_URL = 'http://localhost:8080';
  CONFIGU_APP_URL = 'http://localhost:3000';
}
console.debug('CONFIGU_API_URL:', CONFIGU_API_URL);
console.debug('CONFIGU_APP_URL:', CONFIGU_APP_URL);

export const configuApi = axios.create({
  baseURL: CONFIGU_API_URL,
  responseType: 'json',
});
configuApi.interceptors.response.use(undefined, (error) => {
  // https://axios-http.com/docs/handling_errors
  if (error?.response?.data) {
    throw new Error(error.response.data.message ?? error.response.data);
  } else if (error?.request) {
    throw new Error(
      `There seems to be a problem connecting to Configu's servers. Please check your network connection and try again.`,
    );
  } else {
    throw error;
  }
});

// file system
export const getConfiguHomeDir = async (...paths: string[]): Promise<string> => {
  const directory = path.join(os.homedir(), '.configu', ...paths);
  await fs.mkdir(directory, { recursive: true });
  return directory;
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
    const content = await fs.readFile(absolutePath, { encoding: 'utf-8' });

    if (throwIfEmpty && _.isEmpty(content)) {
      const errorMessage = typeof throwIfEmpty !== 'boolean' ? throwIfEmpty : 'file is empty';
      throw new Error(errorMessage);
    }

    return content;
  } catch (error) {
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

const jiti = createJiti(import.meta.url, { debug: CONFIGU_DEBUG });
export const importModule = async (modulePath: string = '') => {
  const module = await jiti.import(modulePath);
  return module;
};

export const fetchTemplate = async (template: string, destination: string, force = false) => {
  // https://unjs.io/packages/giget#examples
  console.debug('Downloading template:', template);
  const { source, dir } = await downloadTemplate(template, {
    dir: destination,
    force,
    // forceClean: force,
    preferOffline: true,
    registry: false,
  });
  console.debug('Template downloaded:', source, dir);
};
export type { GitInfo } from 'giget';

const npmInstall = promisify(npm.commands.install);

export const installPackageDependencies = async (modulePath: string) => {
  // we use npm v7 to install dependencies as it is the last version that supports npm programmatic API
  // todo: find a way to install dependencies using the npm version corresponding to the current Node.js version - https://nodejs.org/dist/index.json

  // we use pnpm patch to fix npm v7 compatibility issues - https://pnpm.io/cli/patch
  // ✘ [ERROR] Legacy octal escape sequences cannot be used in strict mode
  //    ../../node_modules/.pnpm/npm@7.24.2/node_modules/npm/node_modules/qrcode-terminal/lib/main.js:4:23:

  console.debug('Installing dependencies:', modulePath);
  await npm.load();

  const configuCacheDir = await getConfiguHomeDir('cache');
  // https://docs.npmjs.com/cli/v7/using-npm/config
  npm.prefix = modulePath;
  npm.cache = path.join(configuCacheDir, 'npm-cache');
  npm.config.set('userconfig', path.join(configuCacheDir, 'npmrc'));
  npm.config.set('yes', true);
  npm.config.set('heading', 'configu-npm');
  npm.config.set('color', false);
  npm.config.set('progress', false);
  npm.config.set('audit', false);
  npm.config.set('fund', false);
  npm.config.set('global', false);
  npm.config.set('update-notifier', false);
  npm.config.set('package-lock', false);
  npm.config.set('omit', ['dev', 'optional']);

  await npmInstall([]);
  console.debug('Dependencies installed:', modulePath);
};

// parsers
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

// validators
export const validateNodejsVersion = () => {
  const CONFIGU_IGNORE_NODE = parseBoolean(environment.env.CONFIGU_IGNORE_NODE ?? 'false');
  console.debug('CONFIGU_IGNORE_NODE:', CONFIGU_IGNORE_NODE);

  if (CONFIGU_IGNORE_NODE) {
    return true;
  }

  const version = process.versions.node;
  // todo: find a way to get the repo version smoothly
  const nodeVersion = '22.12.0';
  console.debug('Node.js version:', version);
  const range = `>=${nodeVersion}`;
  if (semver.satisfies(version, range)) {
    return true;
  }

  throw new Error(
    `This tool requires a Node version compatible with ${range} (got ${version}). Upgrade Node, or set \`CONFIGU_IGNORE_NODE=1\` in your environment.`,
  );
};

// input
export const normalizeInput = (
  input: string,
  source: string,
): {
  type: 'json' | 'file' | 'http';
  path: string;
} => {
  // Check if the string is a valid JSON
  try {
    JSON.parse(input);
    return { type: 'json', path: '' };
  } catch {
    // Not a JSON string
  }

  // Check if the string is a valid URL
  try {
    const url = new URL(input);
    if (url.protocol === 'file:') {
      return { type: 'file', path: fileURLToPath(url) };
    }
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { type: 'http', path: input };
    }
  } catch {
    // Not a valid URL
  }

  // Check if the string is a valid path
  try {
    path.resolve(input);
    return { type: 'file', path: input };
  } catch {
    // Not a valid path
  }

  throw new Error(`${source} input is not a valid path, URL, or JSON`);
};
