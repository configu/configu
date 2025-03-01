import path from 'pathe';
import { findUp, findUpMultiple, pathExists } from 'find-up';
import { glob } from 'glob';
import * as stdenv from 'std-env';
import semver from 'semver';
import parseJson from 'parse-json';
import YAML from 'yaml';
import { print, box, debug } from './OutputStreams';
import packageJson from '../../package.json' with { type: 'json' };

const JSON = {
  parse: parseJson,
  stringify: globalThis.JSON.stringify,
};

export { path, findUp, findUpMultiple, pathExists, glob, stdenv, semver, JSON, YAML };

export const validateEngineVersion = () => {
  // todo: find a way to get the repo version smoothly
  const expectedVersion = packageJson.engines.node;
  const expectedRange = `>=${expectedVersion}`;
  const usedVersion = stdenv.nodeVersion ?? process.versions.node;
  debug('Node.js version:', usedVersion);
  if (semver.satisfies(usedVersion, expectedRange)) {
    return;
  }
  print(
    box(
      `Configu requires a Node.js version compatible with ${expectedRange} (got ${usedVersion}).
    Update your Node.js version and try again.`,
      'error',
    ),
  );
  throw new Error('Incompatible Node.js version', { cause: { silent: true } });
};
