module.exports = {
  'packages/**/*.{js,ts}?(x)': (filenames) => [
    'pnpm build',
    `pnpm eslint ${filenames.join(' ')} --ext js,ts --cache --ignore-path .gitignore`,
    `pnpm prettier ${filenames.join(' ')} --check --ignore-path .gitignore`,
  ],
};
