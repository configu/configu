import { snakeCase } from 'change-case';
import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

const TfvarsFormatter: FormatterFunction = (configs) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      let formattedValue;
      if (typeof value === 'string') {
        formattedValue = `"${value}"`;
      } else {
        formattedValue = value;
      }
      return `${snakeCase(key)} = ${formattedValue}`;
    })
    .join('\n');
};

ConfigFormatter.register('TerraformTfvars', TfvarsFormatter);
ConfigFormatter.register('Tfvars', TfvarsFormatter);
