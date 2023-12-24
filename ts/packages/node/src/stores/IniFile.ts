import _ from 'lodash';
import ini from 'ini';
import { type Config } from '@configu/ts';
import { FileConfigStore } from './File';

export type IniFileConfigStoreConfiguration = { path: string };

export class IniFileConfigStore extends FileConfigStore {
  constructor({ path }: IniFileConfigStoreConfiguration) {
    const initialFileState = '';
    super('ini-file', { path, initialFileState });
  }

  parse(fileContent: string) {
    const iniObject = ini.parse(fileContent);

    return Object.entries(iniObject).flatMap(([key, value]) => {
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
    const iniObject = _.merge(rootConfigs, _.omit(groupedConfigs, ''));
    return ini.stringify(iniObject);
  }
}
