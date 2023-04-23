/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  basePath: './',
  cname: 'sdk.configu.com',
  entryPoints: ['packages/ts', 'packages/node', 'packages/browser', 'packages/lib'],
  entryPointStrategy: 'packages',
  out: 'docs',
  name: 'Configu JavaScript Packages',
  navigationLinks: {
    'configu.com': 'https://configu.com',
    'app.configu.com': 'https://app.configu.com',
  },
  hideGenerator: true,
  visibilityFilters: {
    inherited: true,
    protected: true,
  },
};
