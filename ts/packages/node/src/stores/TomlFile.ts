import { ConfigStore, ConfigStoreQuery, Config, Convert } from '@configu/ts';
import _ from 'lodash';
import { promises as fs } from 'fs';
import toml from '@iarna/toml';

export type TomlFileConfigStoreConfiguration = { path: string };

export class TomlFileConfigStore extends ConfigStore {
  private readonly path: string;

  constructor({ path }: TomlFileConfigStoreConfiguration) {
    super('toml-file');
    this.path = path;
  }

  private configsFromTomlObj(tomlObject: toml.JsonMap, currentSet: string, configArr: Config[]) {
    Object.entries(tomlObject).forEach((elem) => {
      if (typeof elem[1] !== 'object') {
        configArr.push({ set: currentSet, key: elem[0], value: elem[1] as string });
      } else {
        let nextSet;
        if (currentSet === '') {
          [nextSet] = elem;
        } else {
          nextSet = `${currentSet}.${elem[0]}`;
        }
        this.configsFromTomlObj(elem[1] as toml.JsonMap, nextSet, configArr);
      }
    });
  }

  async read(): Promise<Config[]> {
    const data = await fs.readFile(this.path, 'utf8');
    const tomlObj = toml.parse(data);
    const configArray: Config[] = [];
    this.configsFromTomlObj(tomlObj, '', configArray);
    return configArray;
  }

  async write(nextConfigs: Config[]): Promise<void> {
    const tomlObject: any = {};
    nextConfigs.forEach((config) => {
      const sets = config.set.split('.');
      if (config.set === '') {
        tomlObject[config.key] = config.value;
      } else if (sets.length === 1) {
        tomlObject[config.set] = {};
        tomlObject[config.set][config.key] = config.value;
      } else {
        const newSet: any = {};
        const currentSet = sets[sets.length - 1];
        newSet[config.key] = config.value;
        tomlObject[sets[sets.length - 2] as string][currentSet as string] = newSet;
      }
    });
    const data = toml.stringify(tomlObject);
    await fs.writeFile(this.path, data);
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const storedConfigs = await this.read();

    return storedConfigs.filter((config) => {
      return queries.some(({ set, key }) => {
        return set === config.set && key === config.key;
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    const storedConfigs = await this.read();

    const nextConfigs = _([...configs, ...storedConfigs])
      .uniqBy((config) => `${config.set}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();

    await this.write(nextConfigs);
  }
}
