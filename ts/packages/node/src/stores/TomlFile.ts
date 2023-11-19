import type { Config } from '@configu/ts';
import toml from '@iarna/toml';
import { FileConfigStore } from './File';

export type TomlFileConfigStoreConfiguration = { path: string };

export class TomlFileConfigStore extends FileConfigStore {
  constructor({ path }: TomlFileConfigStoreConfiguration) {
    const initialFileState = '';
    super('toml-file', { path, initialFileState });
  }

  private configsFromTomlObj(tomlObject: toml.JsonMap, currentSet: string, configArr: Config[]) {
    Object.entries(tomlObject).forEach((elem) => {
      if (typeof elem[1] !== 'object') {
        configArr.push({ set: currentSet, key: elem[0], value: elem[1].toString() });
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

  parse(fileContent: string): Config[] {
    const tomlObj = toml.parse(fileContent);
    const configArray: Config[] = [];
    this.configsFromTomlObj(tomlObj, '', configArray);
    return configArray;
  }

  protected stringify(nextConfigs: Config[]): string {
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
    return toml.stringify(tomlObject);
  }
}
