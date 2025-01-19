import { arch, platform } from 'node:os';
import { cwd } from 'node:process';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {
  ConfigStore,
  ConfigExpression,
  ConfigStoreConstructor,
  ConfigKey,
  CfguSchema,
  _,
  JSONSchema,
  JSONSchemaObject,
  FromSchema,
} from '@configu/sdk';
import {
  console,
  path as pathe,
  environment,
  findUp,
  findUpMultiple,
  glob,
  readFile,
  importModule,
  getConfiguHomeDir,
  parseJSON,
  parseYAML,
  YAML,
  pathExists,
  normalizeInput,
  fetchTemplate,
  GitInfo,
  installPackageDependencies,
  configuSdkPackageUri,
} from './utils';
import { CfguFile } from './CfguFile';

const { join, dirname, resolve } = pathe;

export class ConfiguModule {
  private static register(module: Record<string, unknown>) {
    Object.entries(module).forEach(([key, value]) => {
      if (key === 'default') {
        return;
      }
      console.debug('Registering module property', key);
      if (typeof value === 'function' && 'type' in value) {
        console.debug('Registering ConfigStore:', value.type);
        ConfigStore.register(value as ConfigStoreConstructor);
      } else if (typeof value === 'function') {
        console.debug('Registering ConfigExpression:', key);
        ConfigExpression.register(key, value);
      } else {
        console.debug('Ignore registeree:', key);
      }
    });
  }

  static async registerFile(filePath: string) {
    const module = await import(filePath);
    ConfiguModule.register(module as any);
  }

  private static async tryGetLocalPackage(dirPath: string) {
    try {
      const packageJsonPath = join(dirPath, 'package.json');
      const packageJsonContents = await readFile(packageJsonPath, { throwIfNotFound: true, throwIfEmpty: true });
      const packageJson = parseJSON(packageJsonPath, packageJsonContents);
      return { dir: dirPath, path: packageJsonPath, data: packageJson };
    } catch {
      throw new Error(`Package not found in ${dirPath}`);
    }
  }

  private static async registerLocalPackage({
    dir,
    data,
  }: Awaited<ReturnType<typeof ConfiguModule.tryGetLocalPackage>>) {
    if (!data.exports) {
      throw new Error(`package.json module not found in ${dir}`);
    }

    try {
      JSONSchema.validate(CfguSchema.properties.label, data.exports);
    } catch (error) {
      throw new Error(`package.json module is invalid in ${dir}\n${error.message}`);
    }

    const packageLockPath = join(dir, 'package-lock.json');
    const isPackageLockExists = await pathExists(packageLockPath);
    if (!isPackageLockExists) {
      throw new Error(`package-lock.json not found in ${dir}`);
    }

    const nodeModulesPath = join(dir, 'node_modules');
    const isNodeModulesExists = await pathExists(nodeModulesPath);
    if (!isNodeModulesExists) {
      throw new Error(`node_modules not found in ${dir}`);
    }

    const packageEntries: string[] = Array.isArray(data.exports) ? data.exports : [data.exports];
    await Promise.all(
      packageEntries.map((subdir) => {
        const packageEntryFilePath = join(dir, subdir);
        return ConfiguModule.registerFile(packageEntryFilePath);
      }),
    );
  }

  private static readonly sourceProtoRe = /^([\w-.]+):/;
  private static destructPackageUri(input: string) {
    // https://github.com/unjs/giget/blob/main/src/giget.ts#L51-L62
    let provider: string = '';
    let source: string = input;
    const sourceProviderMatch = input.match(ConfiguModule.sourceProtoRe);
    if (sourceProviderMatch) {
      provider = sourceProviderMatch[1]!;
      source = input.slice(sourceProviderMatch[0].length);
      if (provider === 'http' || provider === 'https') {
        source = input;
      }
    }
    return { provider, source };
  }

  private static readonly inputRegex = /^(?<repo>[\w.-]+\/[\w.-]+)(?<subdir>[^#]+)?(?<ref>#[\w./@-]+)?/;
  private static parseGitURI(input: string) {
    // https://github.com/unjs/giget/blob/main/src/_utils.ts#L47
    const m = input.match(ConfiguModule.inputRegex)?.groups || {};
    return <GitInfo>{
      repo: m.repo,
      subdir: m.subdir || '/',
      ref: m.ref ? m.ref.slice(1) : 'main',
    };
  }

  private static readonly providers = ['github', 'gitlab', 'bitbucket', 'sourcehut']; // "aws-code-commit"

  private static parsePackageUri(input: string) {
    const { provider, source } = ConfiguModule.destructPackageUri(input);
    if (!provider || !ConfiguModule.providers.includes(provider)) {
      throw new Error(`Unsupported package provider: ${provider}`);
    }

    const { repo, subdir, ref } = ConfiguModule.parseGitURI(source);
    const uri = `${provider}:${repo}${subdir}#${ref}`;

    return {
      provider,
      repo,
      subdir,
      ref,
      uri,
    };
  }

  private static getLocalPackageDirName(packageUri: string) {
    return crypto.hash('md5', packageUri, 'hex');
  }

  private static async installPackage(packageUri: string, packageRef: string, dirPath: string) {
    console.debug(`Installing package`, { packageUri, dirPath });

    await fetchTemplate(packageUri, dirPath, true);
    const localPackage = await ConfiguModule.tryGetLocalPackage(dirPath);
    const { path, data } = localPackage;

    const packageRawName = data.name.replace('@configu/', '');
    const configuDependencies: string[] = [];

    if (data.name === `@configu/sdk`) {
      data.exports = data.config.entry;
    }

    data.dependencies = _.mapValues(data.dependencies, (value, key) => {
      if (!key.startsWith('@configu/') || !value.startsWith('workspace:')) {
        return value;
      }
      let configuDependencyUri = '';
      if (key === `@configu/sdk`) {
        configuDependencyUri = `${configuSdkPackageUri}#${packageRef}`;
        configuDependencies.unshift(configuDependencyUri);
      } else {
        // configu dependency which is not sdk must be in the same git uri subdir as the package
        const configuDependency = key.replace('@configu/', '');
        configuDependencyUri = packageUri.replace(packageRawName, configuDependency);
        configuDependencies.push(configuDependencyUri);
      }
      const configuDependencyLocalDirName = ConfiguModule.getLocalPackageDirName(configuDependencyUri);
      return `file:../${configuDependencyLocalDirName}`;
    });

    const packageJsonModifiedContents = JSON.stringify(data, null, 2);
    await fs.writeFile(path, packageJsonModifiedContents);

    if (!_.isEmpty(configuDependencies)) {
      await Promise.all(configuDependencies.map((uri) => ConfiguModule.registerRemotePackage(uri)));
    }

    await installPackageDependencies(dirPath);

    return localPackage;
  }

  static async registerRemotePackage(packageUri: string) {
    console.debug(`Registering package`, { packageUri });
    // todo: allow to cleanup the cache via a command `configu setup --clean-cache`
    const { uri: packageAbsoluteUri, ref: packageRef } = ConfiguModule.parsePackageUri(packageUri);
    const packageLocalDirName = ConfiguModule.getLocalPackageDirName(packageAbsoluteUri);
    const packageLocalDir = await getConfiguHomeDir('cache', packageLocalDirName);
    console.debug(`Package details`, { packageAbsoluteUri, packageRef, packageLocalDir });

    try {
      // todo: think of a way to check if local package is outdated and needs to be updated
      // todo: potentially contribute to giget providers - https://github.com/unjs/giget/blob/main/src/providers.ts
      const localPackage = await ConfiguModule.tryGetLocalPackage(packageLocalDir);
      await ConfiguModule.registerLocalPackage(localPackage);
      console.debug(`Package ${packageAbsoluteUri} exists locally`);
    } catch (ignoredError) {
      // package not found locally or failed to register
      console.debug(`Package ${packageAbsoluteUri} requires installation\n${ignoredError.message}`);
      try {
        const localPackage = await ConfiguModule.installPackage(packageAbsoluteUri, packageRef, packageLocalDir);
        await ConfiguModule.registerLocalPackage(localPackage);
        console.debug(`Package ${packageAbsoluteUri} installed to ${packageLocalDir}`);
      } catch (error) {
        throw new Error(`Failed to install package ${packageUri}\n${error.message}`);
      }
    }
  }
}
