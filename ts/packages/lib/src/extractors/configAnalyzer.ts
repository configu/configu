import { ConfigSchemaType, Cfgu } from '@configu/ts';

// * when adding a new type, update typeCheckOrder array
export const TYPES_CHECK_ORDER: ConfigSchemaType[] = [
  ConfigSchemaType.Number,
  ConfigSchemaType.Boolean,
  ConfigSchemaType.Email,
  ConfigSchemaType.Uuid,
  ConfigSchemaType.Ipv6,
  ConfigSchemaType.Ipv4,
  ConfigSchemaType.SemVer,
  ConfigSchemaType.Domain,
  ConfigSchemaType.Url,
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

export const analyzeValueType = (value: string): ConfigSchemaType => {
  if (!value) {
    // * handle empty value case
    return ConfigSchemaType.String;
  }

  const analyzedType = TYPES_CHECK_ORDER.find((type) => {
    const validator = Cfgu.TYPE_VALIDATORS[type];
    return validator?.({ value });
  });

  return analyzedType ?? ConfigSchemaType.String;
};
