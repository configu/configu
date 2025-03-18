import fs from 'node:fs/promises';
import {
  ConfigSchema,
  ConfigSet,
  _,
  EvalCommandOutput,
  EvaluatedConfigOrigin,
  UpsertCommand,
  JSONSchemaObject,
  ConfigStore,
  NoopConfigStore,
  InMemoryConfigStore,
} from '@configu/sdk';
import { JsonFileConfigStore } from '@configu/json-file';
import { ConfiguPlatformConfigStore } from '@configu/configu-platform';

import { debug, path, stdenv, CONFIGU_PATHS, validateEngineVersion } from './utils';
import { ConfiguFile, ConfiguFileInterfaceConfig } from './ConfiguFile';
import { CfguFile } from './CfguFile';

export class ConfiguInterface {
  public static context: {
    environment: Omit<typeof stdenv, 'process' | 'env'>;
    paths: {
      home: string;
      cache: string;
      bin: string;
    };
    exec: {
      path: string;
      ext: string;
      isHomeEnvSet: boolean;
      isExecFromHome: boolean;
    };
    configu: {
      input?: ConfiguFile;
      local: ConfiguFile;
    };
    interface: ConfiguFileInterfaceConfig;
  };

  static {
    ConfigStore.register(NoopConfigStore);
    ConfigStore.register(InMemoryConfigStore);
    ConfigStore.register(JsonFileConfigStore);
    ConfigStore.register(ConfiguPlatformConfigStore);
  }

  static async init(input?: string) {
    // context will be fully initialized after this method is called
    this.context = {} as any;

    const { process: _process, env: _env, ...environment } = stdenv;
    this.context.environment = environment;
    debug('Interface Environment', this.context.environment);

    this.context.paths = CONFIGU_PATHS;
    debug('Interface Paths', this.context.paths);

    this.initExecution();
    validateEngineVersion();

    await this.initConfig(input);
    process.env.CONFIGU_HOME = this.context.paths.home;
  }

  private static initExecution() {
    if (!this.context.paths.bin) {
      throw new Error('Interface is not initialized');
    }

    // ! deployments of all interfaces must be compatible with the below logic
    const execPath = path.resolve(process.execPath);
    debug('Interface Execution', { execPath, argv: process.argv });
    const isHomeEnvSet = !!stdenv.env.CONFIGU_HOME;
    const execExt = stdenv.isWindows ? '.exe' : '';
    let isExecFromHome = false;
    if (execPath.endsWith(`configu${execExt}`)) {
      isExecFromHome = execPath.startsWith(this.context.paths.bin);
    } else if (execPath.endsWith(`node${execExt}`) && process.argv[1]) {
      const argv1 = path.resolve(process.argv[1]);
      isExecFromHome = argv1.startsWith(this.context.paths.bin);
    } else {
      throw new Error('Unsupported execution of Configu');
    }
    this.context.exec = { path: execExt, ext: execExt, isHomeEnvSet, isExecFromHome };
    debug('Interface Execution', this.context.exec);
  }

  private static async initConfig(input?: string) {
    if (!this.context.paths.home) {
      throw new Error('Interface is not initialized');
    }

    const localFilePath = path.join(this.context.paths.home, '.configu');
    let localConfiguFile: ConfiguFile;
    try {
      localConfiguFile = await ConfiguFile.load(localFilePath);
      debug('Local .configu loaded from', localConfiguFile.path);
    } catch {
      debug('Local .configu failed to load, creating new ...');
      try {
        await fs.unlink(localFilePath);
      } catch {
        // ignore
      }
      localConfiguFile = new ConfiguFile(localFilePath, {}, 'yaml');
    }

    let inputConfiguFile: ConfiguFile | undefined;
    const configInput =
      input ?? stdenv.env.CONFIGU_CONFIG ?? stdenv.env.CONFIGU_CONFIGURATION ?? (await ConfiguFile.searchClosest());
    if (configInput) {
      debug('Input .configu located at', configInput);
      inputConfiguFile = await ConfiguFile.loadFromInput(configInput);
      debug('Input .configu loaded');
    } else {
      debug('Input .configu not found');
    }

    this.context.configu = { local: localConfiguFile, input: inputConfiguFile };

    const envInterfaceConfig = this.getInterfaceConfigFromEnv();
    this.context.interface = _.merge(
      {
        debug: debug.enabled,
      },
      this.context.interface,
      envInterfaceConfig,
      this.context.configu.local.contents.interface,
      this.context.configu.input?.contents?.interface,
    );
    debug('Interface Config', this.context.interface);

    if (this.context.interface.debug) {
      debug.enabled = true;
    }
    // todo: handle global interface configuration here
    // if (this.context.interface.repository) {
    //   ConfiguTemplateProvider.repository = this.context.interface.repository;
    // }
    // if (this.context.interface.registry) {
    //   installPackage.registry = this.context.interface.registry;
    // }
    // todo: handle configuPlatformApi here
  }

  private static getInterfaceConfigFromEnv(
    schema: Exclude<JSONSchemaObject, boolean> = ConfiguFile.schema.properties.interface,
    keyPath: string[] = [],
  ): ConfiguFileInterfaceConfig {
    return _.reduce(
      schema.properties,
      (result, value, key) => {
        if (typeof value === 'boolean') {
          return result;
        }

        if (value.type === 'object') {
          return this.getInterfaceConfigFromEnv(value, [...keyPath, key]);
        }

        const valueFromEnv = stdenv.env[`CONFIGU_${[...keyPath, key].join('_').toUpperCase()}`];
        if (valueFromEnv) {
          if (value.type === 'string') {
            _.set(result, [...keyPath, key], valueFromEnv);
          }
          if (value.type === 'boolean') {
            _.set(result, [...keyPath, key], valueFromEnv === 'true');
          }
          if (value.type === 'number' || value.type === 'integer') {
            _.set(result, [...keyPath, key], Number(valueFromEnv));
          }
          if (value.type === 'array') {
            if (_.isPlainObject(value.items) && (value.items as any)?.type === 'string') {
              _.set(result, [...keyPath, key], valueFromEnv.split(','));
            }
          }
        }
        return result;
      },
      {},
    );
  }

  static async getStoreInstance(nameOrType?: string) {
    debug('getStoreInstance', nameOrType);

    let store =
      (await this.context.configu.input?.getStoreInstance(nameOrType)) ??
      (await this.context.configu.local.getStoreInstance(nameOrType));

    if (!store && nameOrType) {
      store = await ConfiguFile.constructStore({ type: nameOrType });
    }

    if (!store) {
      throw new Error(`store is missing`);
    }

    return store;
  }

  static async backupEvalOutput({
    storeName,
    set,
    schema,
    evalOutput,
  }: {
    storeName?: string;
    set: ConfigSet;
    schema: ConfigSchema;
    evalOutput: EvalCommandOutput;
  }) {
    if (!storeName) {
      return;
    }

    const store =
      (await this.context.configu.input?.getBackupStoreInstance(storeName)) ??
      (await this.context.configu.local.getBackupStoreInstance(storeName));

    if (!store) {
      return;
    }

    const configs = _(evalOutput)
      .pickBy((entry) => entry.origin === EvaluatedConfigOrigin.Store)
      .mapValues((entry) => entry.value)
      .value();

    await new UpsertCommand({
      store,
      set,
      schema,
      configs,
    }).run();
  }

  static async getSchemaInstance(nameOrPath?: string) {
    debug('getSchemaInstance', nameOrPath);

    if (!nameOrPath) {
      return CfguFile.constructSchema(CfguFile.neighborsGlob);
    }

    let schema =
      (await this.context.configu.input?.getSchemaInstance(nameOrPath)) ??
      (await this.context.configu.local.getSchemaInstance(nameOrPath));

    if (!schema && nameOrPath) {
      schema = await CfguFile.constructSchema(nameOrPath);
    }

    if (!schema) {
      throw new Error(`schema is missing`);
    }

    return schema;
  }
}
