import { CfguType, ConfigSchema } from '@configu/ts';

// * when adding a new type, update typeCheckOrder array
export const TYPES_CHECK_ORDER: CfguType[] = [
  CfguType.Number,
  CfguType.Boolean,
  CfguType.Email,
  CfguType.UUID,
  CfguType.IPv6,
  CfguType.IPv4,
  CfguType.SemVer,
  CfguType.Domain,
  CfguType.URL,
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
    return CfguType.String;
  }
  const analyzedType = TYPES_CHECK_ORDER.find((type) => ConfigSchema.validateValueType({ type, value }));
  return analyzedType ?? CfguType.String;
};
