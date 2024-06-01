/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  basePath: '../',
  entryPoints: ['../packages/ts', '../packages/node', '../packages/browser', '../packages/lib'],
  entryPointStrategy: 'packages',
  out: 'interfaces/sdk',

  name: 'Internal SDKs',
  cname: 'docs.configu.com',
  navigationLinks: {
    'configu.com': 'https://configu.com',
    'app.configu.com': 'https://app.configu.com',
  },
  hideGenerator: true,
  visibilityFilters: {
    inherited: true,
    protected: true,
  },
  readme: 'none',

  plugin: ['typedoc-plugin-markdown', 'typedoc-plugin-frontmatter'],
  outputFileStrategy: 'modules',
  flattenOutputFiles: true,
  fileExtension: '.mdx',
  entryFileName: 'overview',
  excludeScopesInPaths: true,
  hidePageHeader: true,
  hidePageTitle: true,
  hideBreadcrumbs: true,
  publicPath: '/interfaces/sdk/',
  sanitizeComments: true,
};
