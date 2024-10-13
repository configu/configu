import { FileConfigStore } from '@configu/integrations/src/utils/File';
import { Config } from '@configu/sdk';
import _ from 'lodash-es';
// eslint-disable-next-line import/no-extraneous-dependencies
import TOML from '@iarna/toml';

export type TomlFileConfigStoreConfiguration = { path: string };

export class TomlFileConfigStore extends FileConfigStore {
  constructor({ path }: TomlFileConfigStoreConfiguration) {
    const initialFileState = '';
    super({ path, initialFileState });
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
