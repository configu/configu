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

const { join, basename } = pathe;

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

  private static getDirnameByUri(packageUri: string) {
    return crypto.hash('md5', packageUri, 'hex');
  }

  private static getAbsoluteUri(packageUri: string) {
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

  private static async getPackageJson(dirPath: string) {
    try {
      return loadPackage(dirPath);
    } catch {
      throw new Error(`package.json not found in ${dirPath}`);
    }
  }

  static async registerLocal(modulePath: string) {
    debug(`registerLocal`, { modulePath });

    const stats = await fs.stat(modulePath);
    let packageLocalDir = '';
    if (stats.isDirectory()) {
      packageLocalDir = modulePath;
    } else if (basename(modulePath) === 'package.json') {
      packageLocalDir = pathe.dirname(modulePath);
    } else {
      await ConfiguModule.registerFile(modulePath);
      return;
    }

    const localPackage = await ConfiguModule.getPackageJson(packageLocalDir);
    const { path, content } = localPackage;

    if (content.name === `@configu/sdk`) {
      return;
    }

    if (!content.exports) {
      throw new Error(`module not found in ${path}`);
    }

    try {
      JSONSchema.validate(CfguSchema.properties.label, content.exports);
    } catch (error) {
      throw new Error(`module is invalid in ${path}\n${error.message}`);
    }

    // todoL rethink if needed as installPackage will reify the package incrementally
    // const packageLockPath = join(packageLocalDir, 'package-lock.json');
    // const isPackageLockExists = await pathExists(packageLockPath);
    // const nodeModulesPath = join(packageLocalDir, 'node_modules');
    // const isNodeModulesExists = await pathExists(nodeModulesPath);

    await installPackage(packageLocalDir);

    const packageEntries = (Array.isArray(content.exports) ? content.exports : [content.exports]) as string[];
    await Promise.all(
      packageEntries.map((subdir) => {
        const packageEntryFilePath = join(packageLocalDir, subdir);
        return ConfiguModule.registerFile(packageEntryFilePath);
      }),
    );
  }

  static async registerRemote(packageUri: string) {
    // todo: allow to cleanup the cache via a command `configu setup --clean-cache` / `configu purge`
    debug(`registerRemote`, { packageUri });

    const packagesLocalDir = join(CONFIGU_PATHS.cache, 'packages');
    const packageAbsoluteUri = ConfiguModule.getAbsoluteUri(packageUri);
    const packageLocalDirName = ConfiguModule.getDirnameByUri(packageAbsoluteUri);
    const packageLocalDir = join(packagesLocalDir, packageLocalDirName);

    await fs.mkdir(packageLocalDir, { recursive: true });
    const template = await downloadRepositoryTemplate(packageUri, packageLocalDir, true);
    const { version } = template;
    const localPackage = await ConfiguModule.getPackageJson(packageLocalDir);
    const { content } = localPackage;

    debug(`registerRemote`, {
      name: content.name,
      version: content.version,
      packageAbsoluteUri,
      packageLocalDir,
    });

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
          // configu dependency which is not sdk must be in the same git uri subdir as the package
          const packageRawName = (content.name as string).replace('@configu/', '');
          const configuDependencyRawName = key.replace('@configu/', '');
          configuDependencyUri = packageUri.replace(packageRawName, configuDependencyRawName);
          configuDependencies.push(configuDependencyUri);
          debug(`Installing @configu/package`, configuDependencyUri);
        }

        const configuDependencyAbsoluteUri = ConfiguModule.getAbsoluteUri(configuDependencyUri);
        const configuDependencyLocalDirName = ConfiguModule.getDirnameByUri(configuDependencyAbsoluteUri);
        return `file:${join(packagesLocalDir, configuDependencyLocalDirName)}`;
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
        await ConfiguModule.registerRemote(uri);
      }
    }

    await ConfiguModule.registerLocal(packageLocalDir);
  }
}
