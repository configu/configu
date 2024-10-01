export class Naming {
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

  static readonly lowerCaseReserved = Naming.reserved.map((name) => name.toLowerCase());
  static readonly errorMessage = `must match ${Naming.pattern} and not be one of ${Naming.reserved.join(', ')}`;
  static validate(name: string) {
    return RegExp(Naming.pattern).test(name) && !Naming.lowerCaseReserved.includes(name.toLowerCase());
  }
}
