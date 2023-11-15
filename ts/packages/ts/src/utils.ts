import _ from 'lodash';
import Mustache from 'mustache';
import Ajv, { type SchemaObject } from 'ajv';

export class ConfigError extends Error {
  constructor(
    protected readonly reason: string,
    protected readonly hint: string = '', // code?: string,
    protected readonly scope: [string, string][] = [],
  ) {
    super(reason);

    this.message = reason;
    if (!_.isEmpty(scope)) {
      this.message = `${this.message} at ${scope.map(([domain, name]) => `${domain}:${name}`).join('.')}`;
    }
    if (hint) {
      this.message = `${this.message}, ${hint}`;
    }
  }

  setReason(reason: string) {
    return new ConfigError(reason, this.hint, this.scope);
  }

  setHint(hint: string) {
    return new ConfigError(this.reason, hint, this.scope);
  }

  appendScope(scope: [string, string][]) {
    return new ConfigError(this.reason, this.hint, [...scope, ...this.scope]);
  }
}

export const REGEX = (pattern: string | RegExp, string: string) => RegExp(pattern).test(string);

const NAMING_PATTERN = /^[A-Za-z0-9_-]+$/;
const RESERVED_NAMES = ['_', '-', 'this', 'cfgu'];
export const NAME = (name: string) => {
  return REGEX(NAMING_PATTERN, name) && !RESERVED_NAMES.includes(name.toLowerCase());
};

export const TMPL = {
  parse: (template: string) => {
    return Mustache.parse(template).map(([type, key, start, end]) => {
      if (!['name', 'text'].includes(type)) {
        throw new Error(`template "${template}" mustn't contain unsupported tokens`);
      }
      return {
        type: type as 'name' | 'text',
        key,
        start,
        end,
      };
    });
  },
  render: (template: string, context: any) => Mustache.render(template, context, {}, { escape: (value) => value }),
};

const ajv = new Ajv();
export const JSON_SCHEMA = (schema: SchemaObject, value: any) => {
  const validate = ajv.compile(schema);
  return validate(value);
};
