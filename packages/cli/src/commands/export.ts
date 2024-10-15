import { Command, Option } from 'clipanion';
import {
  ExportCommand as BaseExportCommand,
  EvalCommandOutput,
  EvaluatedConfig,
  EvaluatedConfigOrigin,
  ExportCommandOutput,
  Expression,
} from '@configu/sdk';
import _ from 'lodash';
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
import { readFile, Registry } from '@configu/common';
import Table from 'tty-table';
import * as t from 'typanion';
import { cwd } from 'process';
import { BaseCommand } from './base';

enum FilterFlag {
  OmitEmpty = 'omit-empty',
  OmitHidden = 'omit-hidden',
  OmitKey = 'omit-key',
  OmitLabel = 'omit-label',
  PickEmpty = 'pick-empty',
  PickHidden = 'pick-hidden',
  PickKey = 'pick-key',
  PickLabel = 'pick-label',
}

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

type TemplateContext = { [key: string]: string } | { key: string; value: string }[];

export class ExportCommand extends BaseCommand {
  static override paths = [['export'], ['ex']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: `Export \`Configs\` as configuration data in various modes`,
    // details: `
    //   A longer description of the command with some \`markdown code\`.

    //   Multiple paragraphs are allowed. Clipanion will take care of both reindenting the content and wrapping the paragraphs as needed.
    // `,
    // examples: [
    //   [`A basic example`, `$0 my-command`],
    //   [`A second example`, `$0 my-command --with-parameter`],
    // ],
  });

  format = Option.String('--format', {
    description: `Format exported \`Configs\` to common configuration formats. Redirect the output to file, if needed`,
    // TODO: get this list from somewhere? or maybe let this fail during runtime if not found in registry?
    // options: CONFIG_FORMAT_TYPE,
  });

  label = Option.String('--label', {
    description: `Metadata required in some formats like Kubernetes ConfigMap`,
  });

  eol = Option.Boolean('--eol,--EOL', {
    description: `Adds EOL (\\n on POSIX \\r\\n on Windows) to the end of the stdout`,
  });

  template = Option.String('--template', {
    description: `Path to a file containing {{mustache}} templates to render (inject/substitute) the exported \`Configs\` into`,
  });

  'template-input' = Option.String('--template-input', {
    description: `Inject \`Configs\` to template as object or array of \`{key: string, value: string}[]\``,
    validator: t.isEnum(['object', 'array']),
  });

  // * (set -a; source <(configu export ... --source); set +a && the command)
  source = Option.Boolean('--source', {
    description: `Source exported \`Configs\` as environment variables to the current shell`,
  });

  run = Option.String('--run', {
    description: `Spawns executable as child-process and pass exported \`Configs\` as environment variables`,
  });

  explain = Option.Boolean('--explain,--report', {
    description: `Outputs metadata on the exported \`Configs\``,
  });

  prefix = Option.String('--prefix', {
    description: `Append a fixed string to the beginning of each Config Key in the export result`,
  });

  suffix = Option.String('--suffix', {
    description: `Append a fixed string to the end of each Config Key in the export result`,
  });

  casing = Option.String('--casing', {
    description: `Transforms the casing of Config Keys in the export result to camelCase, PascalCase, Capital Case, snake_case, param-case, CONSTANT_CASE and others`,
    validator: t.isEnum(Object.keys(casingFormatters)),
  });

  'pick-label' = Option.Array('--pick-label', {
    description: `Pick a specific label from the previous eval command return to export`,
  });

  'omit-label' = Option.Array('--omit-label', {
    description: `Omit a specific label from the previous eval command return to export`,
  });

  'pick-key' = Option.Array('--pick-key', {
    description: `Pick a specific key from the previous eval command return to export`,
  });

  'omit-key' = Option.Array('--omit-key', {
    description: `Omit a specific key from the previous eval command return to export`,
  });

  'pick-hidden' = Option.Boolean('--pick-hidden', {
    description: `Explicitly include config keys marked as hidden. By default, hidden keys are omitted`,
  });

  'omit-hidden' = Option.Boolean('--omit-hidden', {
    description: `Explicitly exclude config keys marked as hidden. By default, hidden keys are omitted`,
  });

  'pick-empty' = Option.Boolean('--pick-empty', {
    description: `Include config keys with empty values. By default, empty values are included`,
  });

  'omit-empty' = Option.Boolean('--omit-empty', {
    description: `Exclude config keys with empty values. By default, empty values are included`,
  });

  static override schema = [
    t.hasMutuallyExclusiveKeys(['explain', 'format', 'template', 'source', 'run'], { missingIf: 'undefined' }),
    t.hasMutuallyExclusiveKeys(['pick-hidden', 'omit-hidden'], { missingIf: 'undefined' }),
    t.hasMutuallyExclusiveKeys(['pick-empty', 'omit-empty'], { missingIf: 'undefined' }),
    t.hasKeyRelationship('template-input', t.KeyRelationship.Requires, ['template']),
    t.hasKeyRelationship('eol', t.KeyRelationship.Requires, ['format']),
  ];

  explainConfigs(configs: EvalCommandOutput) {
    const data = _.chain(configs)
      .values()
      .map(({ key, origin, value }) => ({
        key,
        value,
        origin,
      }))
      .value();
    const table = Table(
      [
        { value: 'key', alias: 'Key' },
        { value: 'value', alias: 'Value' },
        { value: 'origin', alias: 'Origin' },
      ],
      data,
    ).render();
    process.stdout.write(table);
  }

  keysMutations() {
    const haskeysMutations = [this.prefix, this.suffix, this.casing].some((flag) => flag !== undefined);
    if (!haskeysMutations) {
      return undefined;
    }

    return (key: string) => {
      const caseFunction = casingFormatters[this.casing ?? ''];
      const keyWithPrefixSuffix = `${this.prefix ?? ''}${key}${this.suffix ?? ''}`;
      return caseFunction ? caseFunction(keyWithPrefixSuffix) : keyWithPrefixSuffix;
    };
  }

  filterFromFlags(): ((config: EvaluatedConfig) => boolean) | undefined {
    const filterFlags = _.pickBy(this, (value, key) => Object.values(FilterFlag).includes(key as FilterFlag));
    if (_.isEmpty(filterFlags)) {
      return undefined;
    }
    const pickedKeys = (_.pick(filterFlags, [FilterFlag.PickKey])[FilterFlag.PickKey] as string[]) ?? [];
    const pickedLabels = (_.pick(filterFlags, [FilterFlag.PickLabel])[FilterFlag.PickLabel] as string[]) ?? [];
    const omittedKeys = (_.pick(filterFlags, [FilterFlag.OmitKey])[FilterFlag.OmitKey] as string[]) ?? [];
    const omittedLabels = (_.pick(filterFlags, [FilterFlag.OmitLabel])[FilterFlag.OmitLabel] as string[]) ?? [];

    return ({ cfgu, origin, key }: EvaluatedConfig): boolean => {
      const hiddenFilter = this[FilterFlag.PickHidden] ? true : !cfgu.hidden;
      const emptyFilter = this[FilterFlag.OmitEmpty] ? origin !== EvaluatedConfigOrigin.Empty : true;

      const isKeyPicked = pickedKeys.includes(key);
      const isLabelPicked = _.intersection(pickedLabels, cfgu.label ?? []).length > 0;
      const pickFilter = _.isEmpty([...pickedKeys, ...pickedLabels]) || isKeyPicked || isLabelPicked;

      const isKeyOmitted = omittedKeys.includes(key);
      const isLabelOmitted = _.intersection(omittedLabels, cfgu.label ?? []).length > 0;
      const omitFilter = !isKeyOmitted && !isLabelOmitted;

      return hiddenFilter && emptyFilter && pickFilter && omitFilter;
    };
  }

  async exportConfigs(result: ExportCommandOutput, label: string) {
    // TODO: needs the parsed result from the export command
    // if (this.template) {
    //   const templateContent = await readFile(this.template);
    //   let templateContext: TemplateContext = configs;
    //   if (this['template-input'] === 'array') {
    //     templateContext = _(configs)
    //       .entries()
    //       .map(([key, value]) => ({
    //         key,
    //         value,
    //       }))
    //       .value();
    //   }
    //   const { value: compiledContent } = Expression.parse(templateContent).tryEvaluate(templateContext);
    //   process.stdout.write(compiledContent);
    //   return;
    // }

    // TODO: needs to use the Dotenv formatter from the registry
    // if (this.source) {
    //   const formattedConfigs = formatConfigs({ format: 'Dotenv', json: configs, label, wrap: true });
    //   process.stdout.write(formattedConfigs);
    //   return;
    // }

    if (this.run) {
      this.context.configu.runScript(this.run, {
        cwd: cwd(),
        // TODO: needs the parsed result from the export command
        // env: { ...configs, ...process.env },
      });
      return;
    }

    process.stdout.write(result);
  }

  async execute() {
    await this.init();

    const previousEvalCommandOutput = await this.readPreviousEvalCommandOutput();
    if (!previousEvalCommandOutput) {
      this.context.stdio.warn('no configuration was fetched');
      return;
    }

    if (this.explain) {
      this.explainConfigs(previousEvalCommandOutput);
      return;
    }

    const label = this.label ?? `configs-${Date.now()}`;
    const filter = this.filterFromFlags();
    const keys = this.keysMutations();
    const pipe = keys
      ? _.mapValues(previousEvalCommandOutput, (config, key) => ({ ...config, key: keys(key) }))
      : previousEvalCommandOutput;
    // TODO: how do we implement the format flag? we somehow have to connect the format flag with the formatter from the registry and pass it via the 'reduce' prop of ExportCommand
    const exportCommand = new BaseExportCommand({ pipe, filter });
    const { result } = await exportCommand.run();
    // TODO: the previous implementation expected the result to be an object but now export command returns a string that needs to be parsed.
    // await this.exportConfigs(result, label);
    process.stdout.write(result);
  }
}
