import _ from 'lodash';
import Mustache from 'mustache';
import type { CfguType } from './types';

export const ERR = (
  message: string,
  { location = [], suggestion = '' }: { location?: string[]; suggestion?: string } = {},
) => {
  return `${message}${!_.isEmpty(location) ? ` at ${location.join('.')}` : ''}${suggestion ? `, ${suggestion}` : ''}`;
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

const cfguTypeSet = new Set<CfguType>([
  'ARN',
  'AWSRegion',
  'AZRegion',
  'AlibabaRegion',
  'Base64',
  'Boolean',
  'Color',
  'ConnectionString',
  'Country',
  'Currency',
  'DateTime',
  'DockerImage',
  'Domain',
  'Email',
  'GCPRegion',
  'Hex',
  'IBMRegion',
  'IPv4',
  'IPv6',
  'JSONSchema',
  'Language',
  'LatLong',
  'Locale',
  'MACAddress',
  'MD5',
  'MIMEType',
  'MobilePhone',
  'MongoId',
  'Number',
  'OracleRegion',
  'RegEx',
  'SHA',
  'SemVer',
  'String',
  'URL',
  'UUID',
]);

export const isStringInCfguType = (input: string): boolean => {
  return cfguTypeSet.has(input as CfguType);
};
