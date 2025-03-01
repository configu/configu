/* eslint-disable import/no-extraneous-dependencies */
import { createJiti } from 'jiti';
import { downloadTemplate, TemplateProvider, TemplateInfo, GitInfo, providers } from 'giget';
import PackageJson from '@npmcli/package-json';
import Arborist from '@npmcli/arborist';
import { debug } from './OutputStreams';
import { CONFIGU_PATHS } from './FileSystem';

// todo: think of a way to check if local package is outdated and needs to be updated
// todo: potentially contribute to giget providers - https://github.com/unjs/giget/blob/main/src/providers.ts
declare module 'giget' {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const providers: Record<GitInfo['provider'] | 'configu', TemplateProvider>;
}

// todo: after approval of https://about.gitlab.com/solutions/open-source/join/#open-source-program-application
// todo: we can add gitlab support with a mirror of the configu repo on gitlab - https://docs.gitlab.com/ee/user/project/repository/mirror/
// export const ConfiguRepository = `gitlab:configu/configu`;
// export const CONFIGU_DEFAULT_REPOSITORY = `github:configu/configu`;
export const CONFIGU_DEFAULT_REPOSITORY = `configu/configu`;

export const ConfiguTemplateProvider: TemplateProvider & { repository: string } = async (input, options) => {
  // input is a "configu-repository-subdir#git-ref" string
  return providers.github(`${ConfiguTemplateProvider.repository}/${input}`, options) as TemplateInfo;
};
ConfiguTemplateProvider.repository = CONFIGU_DEFAULT_REPOSITORY;
providers.configu = ConfiguTemplateProvider;

export const TemplateProviders = providers;

export const downloadRepositoryTemplate = async (template: string, destination: string, force = false) => {
  debug('XDG_CACHE_HOME:', process.env.XDG_CACHE_HOME);
  const originalXdgCacheHome = process.env.XDG_CACHE_HOME;
  process.env.XDG_CACHE_HOME = CONFIGU_PATHS.cache;

  // https://unjs.io/packages/giget#examples
  debug('Downloading repository template:', template);
  const resp = await downloadTemplate(template, {
    dir: destination,
    force,
    forceClean: force,
    preferOffline: true,
    registry: false,
    providers,
    silent: !debug.enabled,
  });
  debug('Repository template downloaded:', resp);

  process.env.XDG_CACHE_HOME = originalXdgCacheHome;
  return resp;
};

export const loadPackage = async (moduleDir: string) => {
  debug('Loading Package:', moduleDir);
  const pkg = await PackageJson.load(moduleDir);
  debug('Package loaded:', pkg.content.name);
  return pkg;
};

export const CONFIGU_DEFAULT_REGISTRY = `https://registry.npmjs.org`;
export const installPackage = async (moduleDir: string) => {
  debug('Installing Package:', moduleDir);
  const arb = new Arborist({
    path: moduleDir,
    registry: installPackage.registry,
  });
  await arb.reify();
  debug('Package installed:', moduleDir);
};
installPackage.registry = CONFIGU_DEFAULT_REGISTRY;

const jiti = createJiti(import.meta.url, { debug: debug.enabled });
export const importModule = async (moduleFile: string) => {
  debug('Importing Module:', moduleFile);
  const module = await jiti.import(moduleFile);
  debug('Module imported:', moduleFile);
  return module;
};
