import { Command, Option } from 'clipanion';
import { EvalCommandOutput, EvaluatedConfig, Expression, Naming } from '@configu/sdk';
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
import Table from 'tty-table';
import * as t from 'typanion';
import { cwd } from 'process';
import { BaseCommand } from './base';

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

export class CliExportCommand extends BaseCommand {
  static override paths = [['export'], ['ex']];

  static override usage = Command.Usage({
    description: `Export \`Configs\` as configuration data in various modes`,
  });

  format = Option.String('--format', {
    description: `Format exported \`Configs\` to common configuration formats. Redirect the output to file, if needed`,
    // TODO: get this list from somewhere? or maybe let this fail during runtime if not found in registry?
    // options: CONFIG_FORMAT_TYPE,
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

  filter = Option.String('--filter', {
    // TODO: return to an array type
    // filter = Option.Array('--filter', {
    description: `Removes config keys by a given expression`,
  });

  static override schema = [
    t.hasMutuallyExclusiveKeys(['explain', 'format', 'template', 'source', 'run'], { missingIf: 'undefined' }),
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

  filterFromFlags(configs: EvalCommandOutput) {
    if (this.filter === undefined) return configs;
    console.log(Expression.functions.has('TOML'));
    console.log(Expression.functions.has('validators'));
    console.log(Expression.functions.has('isInt'));
    console.log(Expression.functions.keys());
    // TODO: why is validator not working??
    const filteredConfigs = _.omitBy(configs, (config) => {
      const { value, error: renderError } = Expression.parse(this.filter!).tryEvaluate({
        $: config,
      });
      console.log(value);
    });
    // const filteredConfigs = _.reduce();
    return configs;
  }

  async exportConfigs(result: Record<string, string>) {
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

    if (this.run) {
      this.context.configu.runScript(this.run, {
        cwd: cwd(),
        env: result,
      });
      return;
    }

    // eslint-disable-next-line no-template-curly-in-string
    let expression = `\`${this.format ?? 'JSON({json:${pipe}})'}\``;
    // eslint-disable-next-line no-template-curly-in-string
    if (this.source) expression = '`Dotenv({json:${pipe},wrap:true})`';

    // Renders the result value in the expression
    const { value: renderedContent, error: renderError } = Expression.parse(expression).tryEvaluate({
      pipe: result,
    });
    if (renderError) {
      throw new Error(`format expression evaluation failed: ${renderError}`);
    }
    // Evaluates the expression
    const { value: formattedResult, error: formattingError } = Expression.parse(renderedContent).tryEvaluate({});
    if (formattingError || typeof formattedResult !== 'string') {
      throw new Error(`format expression evaluation failed\n${formattingError}`);
    }
    process.stdout.write(formattedResult);
  }

  validateKey(config: EvaluatedConfig) {
    if (!Naming.validate(config.key)) {
      throw new Error(`ConfigKey "${config.key}" ${Naming.errorMessage}`);
    }
    return config;
  }

  private map(pipe: EvalCommandOutput) {
    return _.chain(pipe)
      .mapKeys('key')
      .mapValues((config: EvaluatedConfig) => {
        return this.validateKey(config).value;
      })
      .value();
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

    const keys = this.keysMutations();
    const pipe = keys
      ? _.mapValues(previousEvalCommandOutput, (config, key) => ({ ...config, key: keys(key) }))
      : previousEvalCommandOutput;
    const filteredPipe = this.filterFromFlags(pipe);
    const result = this.map(filteredPipe);
    await this.exportConfigs(result);
  }
}
