module.exports = {
  'packages/**/*.{js,ts}?(x)': (filenames) => [
    'npm run build',
    `eslint --cache --ext js,ts --ignore-path ../.gitignore ${filenames.join(' ')}`, // also runs prettier --check
    // `prettier --check --ignore-path ../.gitignore ${filenames.join(' ')}`,
  ],
};
