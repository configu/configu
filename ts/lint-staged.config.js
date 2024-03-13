module.exports = {
  'packages/**/*.{js,ts}?(x)': (filenames) => [
    'npm run build',
    `npx eslint ${filenames.join(' ')} --ext js,ts --cache --ignore-path ../.gitignore`,
    `npx prettier ${filenames.join(' ')} --check --ignore-path ../.gitignore --ignore-path .prettierignore`,
  ],
};
