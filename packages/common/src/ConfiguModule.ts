import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { ConfigStore, ConfigExpression, ConfigStoreConstructor, CfguSchema, _, JSONSchema } from '@configu/sdk';
import configuSdkPackageJson from '@configu/sdk/package.json';
import {
  debug,
  path as pathe,
  pathExists,
  downloadRepositoryTemplate,
  loadPackage,
  installPackage,
  importModule,
  CONFIGU_PATHS,
} from './utils';

const { join } = pathe;

export class ConfiguModule {
  private static register(module: Record<string, unknown>) {
    Object.entries(module).forEach(([key, value]) => {
      if (key === 'default') {
        return;
      }
      debug('Registering module property', key);
      if (typeof value === 'function' && 'type' in value) {
        debug('Registering ConfigStore:', value.type);
        ConfigStore.register(value as ConfigStoreConstructor);
      } else if (typeof value === 'function') {
        debug('Registering ConfigExpression:', key);
        ConfigExpression.register(key, value);
      } else {
        debug('Ignore registeree:', key);
      }
    });
  }

  static async registerFile(filePath: string) {
    const module = await importModule(filePath);
    ConfiguModule.register(module as any);
  }

  private static getLocalPackageDirName(packageUri: string) {
    return crypto.hash('md5', packageUri, 'hex');
  }

  private static getAbsolutePackageUri(packageUri: string) {
    const uri = new URL(packageUri);
    if (!uri.hash) {
      uri.hash = 'HEAD';
    }
    const isFullHref =
      uri.href === `${uri.protocol}${uri.pathname}${uri.hash}` && uri.href.includes(':') && uri.href.includes('#');
    const isNullOrigin = uri.origin === 'null';
    const isEmptyHostPort = uri.host === '' && uri.hostname === '' && uri.port === '';
    const isEmptySearch = uri.search === '' && uri.searchParams.size === 0;
    if (isFullHref && isNullOrigin && isEmptyHostPort && isEmptySearch) {
      return uri.toString();
    }
    throw new Error(`Invalid package uri: ${packageUri}`);
  }

  private static async tryGetLocalPackage(dirPath: string) {
    try {
      return loadPackage(dirPath);
    } catch {
      throw new Error(`package.json not found in ${dirPath}`);
    }
  }

  private static async registerLocalPackage(dirPath: string) {
    const localPackage = await ConfiguModule.tryGetLocalPackage(dirPath);
    const { path, content } = localPackage;

    if (content.name === `@configu/sdk`) {
      return;
    }

    const packageLockPath = join(dirPath, 'package-lock.json');
    const isPackageLockExists = await pathExists(packageLockPath);
    if (!isPackageLockExists) {
      throw new Error(`package-lock.json not found in ${dirPath}`);
    }

    const nodeModulesPath = join(dirPath, 'node_modules');
    const isNodeModulesExists = await pathExists(nodeModulesPath);
    if (!isNodeModulesExists) {
      throw new Error(`node_modules not found in ${dirPath}`);
    }

    if (!content.exports) {
      throw new Error(`module not found in ${path}`);
    }

    try {
      JSONSchema.validate(CfguSchema.properties.label, content.exports);
    } catch (error) {
      throw new Error(`module is invalid in ${path}\n${error.message}`);
    }

    const packageEntries = (Array.isArray(content.exports) ? content.exports : [content.exports]) as string[];
    await Promise.all(
      packageEntries.map((subdir) => {
        const packageEntryFilePath = join(dirPath, subdir);
        return ConfiguModule.registerFile(packageEntryFilePath);
      }),
    );
  }

  private static async installPackage(packageUri: string, dirPath: string) {
    debug(`Installing package`, { packageUri, dirPath });

    await fs.mkdir(dirPath, { recursive: true });
    const template = await downloadRepositoryTemplate(packageUri, dirPath, true);
    const { version } = template;
    const localPackage = await ConfiguModule.tryGetLocalPackage(dirPath);
    const { content } = localPackage;

    if (content.name === `@configu/sdk` && content.config?.entry) {
      localPackage.update({
        exports: [content.config.entry as string],
      });
    }

    const configuDependencies: string[] = [];
    const dependencies = _.chain(content.dependencies)
      .mapValues((value, key) => {
        if (!value) {
          // code should not reach here
          return '';
        }

        if (!key.startsWith('@configu/') || !value.startsWith('workspace:')) {
          return value;
        }

        let configuDependencyUri = '';
        if (key === `@configu/sdk`) {
          configuDependencyUri = `configu:${configuSdkPackageJson.repository.directory}#${version}`;
          configuDependencies.unshift(configuDependencyUri);
          debug(`Installing @configu/sdk`, configuDependencyUri);
        } else {
          debug(`====`, { key, packageUri });
          // configu dependency which is not sdk must be in the same git uri subdir as the package
          const packageRawName = (content.name as string).replace('@configu/', '');
          const configuDependencyRawName = key.replace('@configu/', '');
          configuDependencyUri = packageUri.replace(packageRawName, configuDependencyRawName);
          configuDependencies.push(configuDependencyUri);
          debug(`Installing @configu/package`, configuDependencyUri);
        }

        const configuDependencyAbsoluteUri = ConfiguModule.getAbsolutePackageUri(configuDependencyUri);
        const configuDependencyLocalDirName = ConfiguModule.getLocalPackageDirName(configuDependencyAbsoluteUri);
        return `file:../${configuDependencyLocalDirName}`;
      })
      .value();

    localPackage.update({
      dependencies,
    });
    await localPackage.save();

    if (!_.isEmpty(configuDependencies)) {
      // eslint-disable-next-line no-restricted-syntax
      for (const uri of configuDependencies) {
        // eslint-disable-next-line no-await-in-loop
        await ConfiguModule.registerRemotePackage(uri);
      }
    }

    await installPackage(dirPath);
  }

  static async registerRemotePackage(packageUri: string) {
    // todo: allow to cleanup the cache via a command `configu setup --clean-cache`
    debug(`Registering package`, { packageUri });

    const packagesLocalDir = join(CONFIGU_PATHS.cache, 'packages');
    const packageAbsoluteUri = ConfiguModule.getAbsolutePackageUri(packageUri);
    const packageLocalDirName = ConfiguModule.getLocalPackageDirName(packageAbsoluteUri);
    const packageLocalDir = join(packagesLocalDir, packageLocalDirName);
    debug(`Package details`, { packageAbsoluteUri, packageLocalDir });

    try {
      await ConfiguModule.registerLocalPackage(packageLocalDir);
      debug(`Package ${packageAbsoluteUri} registered locally`);
    } catch (ignoredError) {
      debug(`Package ${packageUri} is reinstalled due:\n${ignoredError.message}`);
      try {
        await ConfiguModule.installPackage(packageAbsoluteUri, packageLocalDir);
        await ConfiguModule.registerLocalPackage(packageLocalDir);
        debug(`Package ${packageAbsoluteUri} installed to ${packageLocalDir}`);
      } catch (error) {
        throw new Error(`Failed to install package ${packageUri}\n${error.message}`);
      }
    }
  }
}
