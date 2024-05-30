/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  exclude: ['**/*.test.ts', '**/node_modules/**', '**/build/**'],
  excludeExternals: true,
  excludePrivate: true,
  gitRevision: 'main',
};
