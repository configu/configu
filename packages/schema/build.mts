/* eslint-disable import/no-extraneous-dependencies */

import { $ } from 'zx';
import * as fs from 'node:fs/promises';
import { JSONSchemaObject } from '@configu/sdk/expressions';
import { CfguFile, ConfiguFile, path } from '@configu/common';

const ROOT_PATH = path.join(import.meta.dirname, '..', '..');
const DIST_PATH = import.meta.dirname;

const buildJSONSchemaFile = async (schema: JSONSchemaObject, filePath: string) => {
  const contents = JSON.stringify(schema, null, 2);
  await fs.writeFile(filePath, contents, { flag: 'w' });
};

(async () => {
  const cfguPath = path.join(DIST_PATH, '.cfgu.json');
  await buildJSONSchemaFile(CfguFile.schema, cfguPath);

  const configuPath = path.join(DIST_PATH, '.configu.json');
  await buildJSONSchemaFile(ConfiguFile.schema, configuPath);

  await $`pnpm prettier --ignore-path ${path.join(ROOT_PATH, '.gitignore')} --write ${cfguPath} ${configuPath}`.pipe(
    process.stdout,
  );
})();
