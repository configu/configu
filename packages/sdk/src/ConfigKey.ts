import _ from 'lodash';

export class ConfigKey {
  static readonly pattern = '^[A-Za-z0-9_-]+$';
  static readonly reserved = [
    '_',
    '-',
    '$',
    'this',
    'Cfgu',
    'Config',
    'ConfigStore',
    'ConfigSet',
    'ConfigKey',
    'Key',
    'ConfigValue',
    'Value',
    'ConfigSchema',
    'Configu',
  ];

  private static readonly normalizedReserved = ConfigKey.reserved.map(ConfigKey.normalize);

  static normalize(key: string) {
    // flatCase - flatten and lowercase
    return _.camelCase(key).toLowerCase();
  }

  static validate({ key, errorPrefix = 'ConfigKey' }: { key: string; errorPrefix?: string }) {
    try {
      const isValid =
        RegExp(ConfigKey.pattern).test(key) && !ConfigKey.normalizedReserved.includes(ConfigKey.normalize(key));
      if (!isValid) {
        throw new Error();
      }
    } catch (error) {
      throw new Error(
        `${errorPrefix} "${key}" must match ${ConfigKey.pattern} and not be one of ${ConfigKey.reserved.join(', ')}`,
      );
    }
  }
}
