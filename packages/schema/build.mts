/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */

import 'zx/globals';
import { join } from 'node:path';
import { SchemaObject } from '@configu/sdk';
import { CfguFile, ConfiguFile } from '@configu/common';

const ROOT_PATH = path.join(import.meta.dirname, '..', '..');
const SCHEMA_ROOT_PATH = import.meta.dirname;

const buildJSONSchemaFile = async (schema: SchemaObject, path: string) => {
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
