/* eslint-disable no-undef */
/* eslint-disable n/no-extraneous-import */
/* eslint-disable import/no-extraneous-dependencies */

import 'zx/globals';

export const ROOT_PATH = path.join(__dirname, '..', '..');
export const CLI_ROOT_PATH = __dirname;

cd(CLI_ROOT_PATH);

await $`pnpm clean`.pipe(process.stdout);
await $`pnpm build`.pipe(process.stdout);

await $`mkdir tmp`.pipe(process.stdout);
await $`cp -rf bin build package.json tmp`.pipe(process.stdout);

// todo: https://github.com/pnpm/pnpm/issues/5926 https://stackoverflow.com/questions/46653833/is-there-a-way-to-force-npm-to-generate-package-lock-json/
// await $`cp -rf ../../pnpm-lock.yaml tmp`.pipe(process.stdout);

await $`pnpm oclif manifest`.pipe(process.stdout);
await $`mv oclif.manifest.json tmp/`.pipe(process.stdout);
await $`pnpm build:ref`.pipe(process.stdout);
await $`mv ref.md tmp/README.md`.pipe(process.stdout);

cd(path.join(CLI_ROOT_PATH, 'tmp'));

await $`npm install --package-lock-only --ignore-scripts`.pipe(process.stdout);

// await $`pnpm install --shamefully-hoist --ignore-scripts`.pipe(process.stdout);
// await $`pnpm install --frozen-lockfile --no-optional`.pipe(process.stdout);

await $`pnpm oclif pack tarballs --parallel`.pipe(process.stdout);
