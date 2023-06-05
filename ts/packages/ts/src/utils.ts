import _ from 'lodash';
import Mustache from 'mustache';

export const ERR = (
  message: string,
  { location = [], suggestion = '' }: { location?: string[]; suggestion?: string } = {},
) => {
  return `${message}${!_.isEmpty(location) ? ` at ${location.join(' -> ')}` : ''}${
    suggestion ? `, ${suggestion}` : ''
  }`;
};

const NAMING_PATTERN = /^[A-Za-z0-9_-]+$/;
const RESERVED_NAMES = ['_', '-', 'this', 'cfgu'];
export const NAME = (name: string) => {
  return RegExp(NAMING_PATTERN).test(name) && !RESERVED_NAMES.includes(name.toLowerCase());
};

export const TMPL = {
  parse: (template: string) => {
    return Mustache.parse(template).map(([type, key, start, end]) => {
      if (!['name', 'text'].includes(type)) {
        throw new Error(ERR(`invalid template "${template}"`, { location: ['Template', 'parse'] }));
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
