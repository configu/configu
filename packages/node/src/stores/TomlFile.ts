import _ from 'lodash';
import TOML from '@iarna/toml';
import { type Config } from '@configu/ts';
import { FileConfigStore } from './File';

export type TomlFileConfigStoreConfiguration = { path: string };

export class TomlFileConfigStore extends FileConfigStore {
  constructor({ path }: TomlFileConfigStoreConfiguration) {
    const initialFileState = '';
    super('toml-file', { path, initialFileState });
  }

  parse(fileContent: string) {
    const tomlObject = TOML.parse(fileContent);

    return Object.entries(tomlObject).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        return [{ set: '', key, value }];
      }
      if (_.isPlainObject(value)) {
        return _(Object.entries(value))
          .filter(([, innerValue]) => typeof innerValue === 'string')
          .map(([innerKey, innerValue]) => ({
            set: key,
            key: innerKey,
            value: innerValue as string,
          }))
          .value();
      }
      return [];
    });
  }

  stringify(nextConfigs: Config[]) {
    const groupedConfigs = _(nextConfigs)
      .groupBy('set')
      .mapValues((setConfigs) => _.merge({}, ...setConfigs.map((config) => ({ [config.key]: config.value }))))
      .value();
    const rootConfigs = groupedConfigs[''];
    const tomlObject = _.merge(rootConfigs, _.omit(groupedConfigs, ''));
    return TOML.stringify(tomlObject);
  }
}
