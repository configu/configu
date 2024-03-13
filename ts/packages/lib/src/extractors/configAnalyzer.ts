import { type CfguType, ConfigSchema } from '@configu/ts';

// * when adding a new type, update typeCheckOrder array
export const TYPES_CHECK_ORDER: CfguType[] = [
  'Number',
  'Boolean',
  'Email',
  'UUID',
  'IPv6',
  'IPv4',
  'SemVer',
  'Domain',
  'URL',
  // ! currently its limited to the types above
  // 'Base64',
  // 'Locale',
  // 'SHA',
  // 'MD5',
  // 'MobilePhone',
  // 'ConnectionString',
  // 'LatLong',
  // 'Color',
  // 'Hex',
];

export const analyzeValueType = (value: string): CfguType => {
  if (!value) {
    // * handle empty value case
    return 'String';
  }
  const analyzedType = TYPES_CHECK_ORDER.find((type) => ConfigSchema.CFGU.VALIDATORS.TYPE[type]({ type, value }));
  return analyzedType ?? 'String';
};
