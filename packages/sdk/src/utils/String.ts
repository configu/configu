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
    'ConfigSchema',
    'Configu',
  ];

  static readonly lowerCaseReserved = Naming.reserved.map((name) => name.toLowerCase());
  static readonly errorMessage = `must match ${Naming.pattern} and not be one of ${Naming.reserved.join(', ')}`;
  static validate(name: string) {
    return RegExp(Naming.pattern).test(name) && !Naming.lowerCaseReserved.includes(name.toLowerCase());
  }
}

export class String {
  static createRegExp(patternString: string): RegExp {
    // Create a RegExp object from the pattern string
    const match = patternString.match(/^\/(.*?)\/([gimyusdv]*)$/);
    if (match) {
      const [, pattern = '', flags = ''] = match;
      return new RegExp(pattern, flags);
    }
    // Handle strings that don't specify flags
    return new RegExp(patternString);
  }
}
