/* eslint-disable no-undef */
/* eslint-disable n/no-extraneous-import */
/* eslint-disable import/no-extraneous-dependencies */

import 'zx/globals';

const ROOT_PATH = path.join(__dirname, '..', '..');
const CLI_ROOT_PATH = __dirname;

const REF_PATH = process.env.REF_PATH ?? path.join(CLI_ROOT_PATH, 'ref.md');

await $`echo '<!-- commands -->'`.pipe(fs.createWriteStream(REF_PATH));
await $`pnpm oclif readme --no-aliases --readme-path ${REF_PATH}`.pipe(process.stdout);

let contents = await fs.readFile(REF_PATH, { encoding: 'utf8' });

contents = contents.replace('<!-- commands -->\n', '');
contents = contents.replace('<!-- commandsstop -->\n', '');

contents = contents.replaceAll(/## `(.*)`/g, '## $1');

contents = contents.replaceAll('\nUSAGE', 'bash\nUSAGE');
contents = contents.replaceAll(/\n_.*_\n/g, '');

await fs.writeFile(REF_PATH, contents, { flag: 'w' });
