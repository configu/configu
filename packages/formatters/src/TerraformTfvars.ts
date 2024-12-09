import { snakeCase } from 'change-case';
import { ConfigFormatter, FormatterFunction } from './ConfigFormatter';

export const TerraformTfvarsFormatter: FormatterFunction = (configs) => {
  return Object.entries(configs)
    .map(([key, value]) => {
      let formattedValue: string;
      try {
        JSON.parse(value as any);
        formattedValue = value as string;
      } catch (err) {
        formattedValue = `"${value}"`;
      }
      return `${snakeCase(key)} = ${formattedValue}`;
    })
    .join('\n');
};

ConfigFormatter.register('tfvars', TerraformTfvarsFormatter);
ConfigFormatter.register('terraform-tfvars', TerraformTfvarsFormatter);
