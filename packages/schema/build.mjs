/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */

import 'zx/globals';
import { ConfigSchemaContents } from '@configu/ts';

const ROOT_PATH = path.join(__dirname, '..', '..');
const SCHEMA_ROOT_PATH = __dirname;

const JSON_SCHEMA_PATH = path.join(SCHEMA_ROOT_PATH, '.cfgu2.json');
const contents = JSON.stringify(ConfigSchemaContents, null, 2);

await fs.writeFile(JSON_SCHEMA_PATH, contents, { flag: 'w' });
