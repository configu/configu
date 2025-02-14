import { fileURLToPath, URL } from 'node:url';
import path from 'pathe';
import { findUp, findUpMultiple, pathExists } from 'find-up';
import { glob } from 'glob';
import * as stdenv from 'std-env';
import semver from 'semver';
import parseJson from 'parse-json';
import YAML from 'yaml';
import { debug } from './OutputStreams';
// eslint-disable-next-line import/no-relative-packages
import RootWorkspacePkg from '../../../../package.json' with { type: 'json' };

const JSON = {
  parse: parseJson,
  stringify: globalThis.JSON.stringify,
};

export { path, findUp, findUpMultiple, pathExists, glob, stdenv, semver, JSON, YAML };

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

export const validateEngineVersion = () => {
  // todo: find a way to get the repo version smoothly
  const expectedVersion = RootWorkspacePkg.devEngines.runtime.version;
  const expectedRange = `>=${expectedVersion}`;
  const usedVersion = stdenv.nodeVersion ?? process.versions.node;
  debug('Node.js version:', usedVersion);
  if (semver.satisfies(usedVersion, expectedRange)) {
    return true;
  }
  throw new Error(
    `Configu requires a Node.js version compatible with ${expectedRange} (got ${usedVersion}).
Upgrade Node.js, or set \`CONFIGU_IGNORE_NODE=1\` in your environment.`,
  );
};
