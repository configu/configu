import validator from 'validator';

export class StringValidator {
  static isBoolean(string: string) {
    return validator.isBoolean(string, { loose: true });
  }

  static isNumber(string: string) {
    // validator.isInt(value, ...options);
    // validator.isOctal(value);
    // validator.isDecimal(value);
    // validator.isHexadecimal(value);
    return validator.isNumeric(string);
  }

  static isString(string: string) {
    return true;
  }

  static isMatches(string: string, pattern: string) {
    return validator.matches(string, pattern);
  }

  static isIncluded(string: string, array: string[]) {
    return validator.isIn(string, array);
  }
}
