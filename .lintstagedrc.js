/* eslint-disable no-undef */

module.exports = {
  '**/package.json': () => 'pnpm deps:check',
  'packages/**/*.ts': () => 'pnpm type:check',
  '*.{js,mjs,ts,mts}': (filenames) => [
    `pnpm format --check ${filenames.join(' ')}`,
    `pnpm lint --quiet ${filenames.join(' ')}`,
  ],
  '*.{md,mdx,json,yml}': (filenames) => `pnpm format --check ${filenames.join(' ')}`,
};
