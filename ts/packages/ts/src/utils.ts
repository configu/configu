import _ from 'lodash';
import Mustache from 'mustache';
import Ajv, { SchemaObject } from 'ajv';

export class ConfigError extends Error {
  constructor(
    public reason: string,
    public hint: string = '', // code?: string,
    public scope: [string, string][] = [],
  ) {
    super();
    this.setMessage();
  }

  protected setMessage() {
    this.message = this.reason;
    if (!_.isEmpty(this.scope)) {
      this.message = `${this.message} at ${this.scope.map(([domain, name]) => `${domain}:${name}`).join('.')}`;
    }
    if (this.hint) {
      this.message = `${this.message}, ${this.hint}`;
    }
  }

  setReason(reason: string) {
    this.reason = reason;
    this.setMessage();
  }

  setHint(hint: string) {
    this.hint = hint;
    this.setMessage();
  }

  appendScope(scope: [string, string][]) {
    this.scope = [...scope, ...this.scope];
    this.setMessage();
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
