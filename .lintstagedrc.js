module.exports = {
  '**/package.json': () => 'pnpm pkg:fix',
  'packages/**/*.ts': () => 'pnpm build',
  '*.{js,mjs,ts,mts}': (filenames) => [
    `pnpm format --write ${filenames.join(' ')}`,
    `pnpm lint --fix ${filenames.join(' ')}`,
  ],
  '*.{md,mdx,json,yml}': (filenames) => `pnpm format --write ${filenames.join(' ')}`,
};
