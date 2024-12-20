// @ts-check
const rootPackageJson = require('./package.json');

/** @type {import("syncpack").RcFile} */
const config = {
  sortFirst: [
    'name',
    'version',
    'description',
    'keywords',
    'homepage',
    'repository',
    'bugs',
    'license',
    'author',
    'packageManager',
    'engines',
    'type',
    'bin',
    'types',
    'main',
    'module',
    'exports',
    'files',
    'config',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ],
  sortAz: ['keywords', 'dependencies', 'devDependencies', 'peerDependencies'],
  versionGroups: [
    {
      label: 'Use workspace protocol consuming local packages',
      packages: ['**'],
      dependencies: ['$LOCAL'],
      dependencyTypes: ['!local'],
      pinVersion: 'workspace:*',
    },
    {
      label: 'Ensure all packages use whatever version the root package is using',
      packages: ['**'],
      dependencies: Object.keys(rootPackageJson.devDependencies),
      dependencyTypes: ['dev'],
      snapTo: ['@configu/configu'],
    },
    {
      label: 'Ignore issues in @configu/examples',
      packages: ['examples'],
      dependencies: ['**'],
      isIgnored: true,
    },
    {
      label: '@types packages should only be under devDependencies',
      dependencies: ['@types/**'],
      dependencyTypes: ['!dev'],
      isBanned: true,
    },
    {
      label: 'Banned dependencies',
      packages: ['**'],
      dependencies: ['underscore'],
      isBanned: true,
    },
  ],
};

module.exports = config;
