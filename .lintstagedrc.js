module.exports = {
  'packages/**/*.ts?(x)': () => 'pnpm build --force',
  '*.{js,mjs,ts}?(x)': (filenames) => [
    `pnpm prettier ${filenames.join(' ')} --ignore-path .gitignore --write`,
    `pnpm eslint ${filenames.join(' ')} --ignore-path .gitignore --cache --fix`,
  ],
  '*.{md,mdx,json,yml}': (filenames) => `pnpm prettier ${filenames.join(' ')} --ignore-path .gitignore --write`,
};
