/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */

import 'zx/globals';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSONSchemaObject } from '@configu/sdk';
import { CfguFile, ConfiguFile } from '@configu/common';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = path.join(__dirname, '..', '..');
const SCHEMA_ROOT_PATH = __dirname;

const buildJSONSchemaFile = async (schema: JSONSchemaObject, path: string) => {
  const contents = JSON.stringify(schema, null, 2);
  await fs.writeFile(path, contents, { flag: 'w' });
};

(async () => {
  const cfguPath = join(SCHEMA_ROOT_PATH, '.cfgu.json');
  await buildJSONSchemaFile(CfguFile.schema, cfguPath);

  const configuPath = join(SCHEMA_ROOT_PATH, '.configu.json');
  await buildJSONSchemaFile(ConfiguFile.schema, configuPath);

  await $`pnpm prettier --ignore-path ${join(ROOT_PATH, '.gitignore')} --write ${cfguPath} ${configuPath}`.pipe(
    process.stdout,
  );
})();
