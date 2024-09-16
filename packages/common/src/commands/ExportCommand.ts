import {
  ExportCommand as BaseExportCommand,
  type ExportCommandParameters as BaseExportCommandParameters,
} from '@configu/ts';
import {
  dotCase,
  constantCase,
  noCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
  capitalCase,
  camelCase,
  paramCase,
} from 'change-case';

const casingFormatters: Record<string, (string: string) => string> = {
  CamelCase: camelCase,
  CapitalCase: capitalCase,
  ConstantCase: constantCase,
  DotCase: dotCase,
  KebabCase: paramCase,
  NoCase: noCase,
  PascalCase: pascalCase,
  PascalSnakeCase: (string: string) => capitalCase(string).split(' ').join('_'),
  PathCase: pathCase,
  SentenceCase: sentenceCase,
  SnakeCase: snakeCase,
  TrainCase: (string: string) => capitalCase(string).split(' ').join('-'),
};

export type ExportCommandParameters = BaseExportCommandParameters & {
  override?: boolean;
  suffix?: string;
  prefix?: string;
  casing?: string;
};

export class ExportCommand extends BaseExportCommand {
  constructor(public parameters: ExportCommandParameters) {
    super(parameters);
  }

  keysMutations() {
    const { suffix, prefix, casing = '' } = this.parameters;

    const haskeysMutations = [prefix, suffix, casing].some((flag) => flag !== undefined);
    if (!haskeysMutations) {
      return undefined;
    }

    return (key: string) => {
      const caseFunction = casingFormatters[casing ?? ''];
      const keyWithPrefixSuffix = `${prefix ?? ''}${key}${suffix ?? ''}`;
      return caseFunction ? caseFunction(keyWithPrefixSuffix) : keyWithPrefixSuffix;
    };
  }

  async run() {
    const keys = this.keysMutations();
    if (keys) this.parameters.keys = keys;
    const res = await super.run();
    return res;
  }
}
