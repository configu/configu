import { promises as fs, existsSync } from 'fs';
import _ from 'lodash';
import ini from 'ini';
import { type Config } from '@configu/ts';
import { FileConfigStore } from './FileConfigStore';

export type IniFileConfigStoreConfiguration = { path: string };

export class IniFileConfigStore extends FileConfigStore {
  constructor({ path }: IniFileConfigStoreConfiguration) {
    super('ini-file', path);
  }

  async init() {
    const fileExists = await existsSync(this.path);
    if (!fileExists) {
      await fs.writeFile(this.path, '');
    }
  }

  async read() {
    const data = await fs.readFile(this.path, 'utf8');
    const iniObject = ini.parse(data);

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

  async write(nextConfigs: Config[]) {
    const groupedConfigs = _(nextConfigs)
      .groupBy('set')
      .mapValues((setConfigs) => _.merge({}, ...setConfigs.map((config) => ({ [config.key]: config.value }))))
      .value();
    const rootConfigs = groupedConfigs[''];
    const iniObject = _.merge(rootConfigs, _.omit(groupedConfigs, ''));

    const data = ini.stringify(iniObject);
    await fs.writeFile(this.path, data);
  }
}
