import _ from 'lodash';
import validator from 'validator';
import * as changeCase from 'change-case';

export class String {
  static readonly namePattern = '^[A-Za-z0-9_-]+$';
  static readonly reservedNames = [
    '_',
    '-',
    'this',
    'Configu',
    'Cfgu',
    'Config',
    'ConfigStore',
    'ConfigSet',
    'ConfigSet',
    'ConfigSchema',
  ];

  static readonly reservedNamesLowerCase = String.reservedNames.map((name) => name.toLowerCase());

  static readonly namingErrorMessage = `must match ${String.namePattern} and not be one of ${String.reservedNames.join(', ')}`;
  static validateNaming(string: string) {
    return (
      validator.matches(string, String.namePattern) &&
      !validator.isIn(string.toLowerCase(), String.reservedNamesLowerCase)
    );
  }

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

  static generateCaseVariations(string: string) {
    return _.uniq([
      string,
      string.toLowerCase(),
      changeCase.camelCase(string),
      changeCase.kebabCase(string),
      changeCase.pascalCase(string),
      changeCase.snakeCase(string),
    ]);
  }

  static generateAliases(keys: readonly string[]) {
    return _(keys).keyBy().mapValues(String.generateCaseVariations).value();
  }
}
