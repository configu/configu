import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import * as prompts from '@clack/prompts';
import { spawnSync } from 'node:child_process';
import { log } from '@clack/prompts';
import {
  ConfigExpression,
  ConfigKey,
  ConfigValue,
  _,
  EvalCommandOutput,
  EvaluatedConfig,
  EvaluatedConfigOrigin,
} from '@configu/sdk';
import { print, table, readFile, color } from '@configu/common';
import { ConfigFormatter, ConfigFormat } from '@configu/formatters';

import { BaseCommand } from './base';

// type TemplateContext = { [key: string]: string } | { key: string; value: string }[];

type ExportCommandFilter = (config: EvaluatedConfig) => boolean;
type ExportCommandMapper = (config: EvaluatedConfig) => EvaluatedConfig;
// type ExportCommandReducer = (configs: EvaluatedConfig[]) => string;

export class CliExportCommand extends BaseCommand {
  static override paths = [['export'], ['ex']];

  static override usage = Command.Usage({
    description: `Export \`Configs\` as configuration data in various modes`,
  });

  explain = Option.Boolean('--explain,--report', {
    description: `Outputs metadata on the exported \`Configs\``,
  });

  filter = Option.Array('--filter', {
    description: `Picks config keys by a given expression`,
    validator: t.isArray(t.isString()),
  });

  // sort = Option.String('--sort', {
  //   description: `Picks config keys by a given expression`,
  // });

  // map = Option.Array('--map', {
  //   description: `Picks config keys by a given expression`,
  //   validator: t.isArray(t.isString()),
  // });

  prefix = Option.String('--prefix', {
    description: `Append a fixed string to the beginning of each Config Key in the export result`,
  });

  suffix = Option.String('--suffix', {
    description: `Append a fixed string to the end of each Config Key in the export result`,
  });

  casing = Option.String('--casing', {
    description: `Transforms the casing of Config Keys in the export result to camelCase, PascalCase, Capital Case, snake_case, param-case, CONSTANT_CASE and others`,
    // validator: t.isEnum(Object.keys(casingFormatters)),
  });

  // reduce = Option.Array('--reduce', {
  //   description: `Picks config keys by a given expression`,
  //   validator: t.isArray(t.isString()),
  // });

  format = Option.String('--format', {
    description: `Format exported \`Configs\` to common configuration formats. Redirect the output to file, if needed`,
    // validator: t.isEnum(ConfigFormats),
  });

  template = Option.String('--template', {
    description: `Path to a file containing {{mustache}} templates to render (inject/substitute) the exported \`Configs\` into`,
  });

  // * (set -a; source <(configu export ... --source); set +a && the command)
  source = Option.Boolean('--source', {
    description: `Source exported \`Configs\` as environment variables to the current shell`,
  });

  run = Option.String('--run', {
    description: `Spawns executable as child-process and pass exported \`Configs\` as environment variables`,
  });

  static override schema = [
    t.hasMutuallyExclusiveKeys(['explain', 'format', 'template', 'source', 'run'], { missingIf: 'undefined' }),
  ];

  explainConfigs(pipe: EvalCommandOutput) {
    const orderedOrigins = [
      EvaluatedConfigOrigin.Const,
      EvaluatedConfigOrigin.Override,
      EvaluatedConfigOrigin.Store,
      EvaluatedConfigOrigin.Default,
      EvaluatedConfigOrigin.Empty,
    ];
    const data = _.chain(pipe)
      .values()
      .sortBy([({ origin }) => orderedOrigins.indexOf(origin), 'key'])
      .map((output) => {
        let origin = `${output.origin}`;
        const { key, value, set } = output;
        if (origin === EvaluatedConfigOrigin.Store) {
          origin = `${origin} ${color.dim(`(${set})`)}`;
        }
        return [origin, key, value];
      })
      .value();
    const dataWithHeaders = [['Origin', 'Key', 'Value'], ...data];
    prompts.note(
      table(dataWithHeaders, { columns: [{}, {}, { width: 20, wrapWord: true }] }),
      `Export Report ${color.dim(`(${data.length})`)}`,
    );
  }

  async filterConfigs(pipe: EvalCommandOutput) {
    const hidden: ExportCommandFilter = (config) => !config.cfgu?.hidden;

    const flag: ExportCommandFilter = this.filter
      ? (config) => {
          const evaluationContext = ConfigValue.createEvaluationContext({ current: config.key, configs: pipe });
          const joinedFilter = this.filter?.join(' && ') ?? '';
          return ConfigExpression.evaluateBoolean(joinedFilter, evaluationContext);
        }
      : (config) => true;

    return _.chain(pipe)
      .pickBy((config) => hidden(config) && flag(config))
      .value();
  }

  async mapConfigs(pipe: EvalCommandOutput) {
    const prefixSuffix: ExportCommandMapper = (config) => {
      const nextKey = `${this.prefix ?? ''}${config.key}${this.suffix ?? ''}`;
      return { ...config, key: nextKey };
    };

    const casing: ExportCommandMapper = this.casing
      ? (config) => {
          const caseFunction = ConfigFormatter.changeCase(this.casing ?? '', config.key);
          return { ...config, key: caseFunction };
        }
      : (config) => config;

    const validate: ExportCommandMapper = (config) => {
      ConfigKey.validate({ key: config.key });
      return config;
    };

    return _.chain(pipe)
      .mapValues((config) => _.flow([prefixSuffix, casing, validate])(config))
      .value();
  }

  injectConfigs(pipe: EvalCommandOutput) {
    const env = _.chain(pipe).keyBy('key').mapValues('value').value();
    spawnSync(this.run as string, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { ...env, ...process.env },
      shell: true,
    });
  }

  async reduceConfigs(pipe: EvalCommandOutput) {
    const evaluationContext = ConfigValue.createEvaluationContext({ configs: pipe });

    if (this.template) {
      const templateContent = await readFile(this.template);
      try {
        return ConfigExpression.evaluateTemplateString(templateContent, evaluationContext);
      } catch (error) {
        throw new Error(`template expression evaluation failed: ${error}`);
      }
    }

    const configs = _.chain(pipe)
      .keyBy('key')
      .mapValues(({ value }) => ConfigValue.parse(value))
      .value();

    if (this.source) {
      return ConfigFormatter.format('dotenv', configs, {});
    }

    return ConfigFormatter.format(this.format ?? 'beautified-json', configs, {});
  }

  async execute() {
    await this.init();

    const { pipe } = this.context;
    if (!pipe) {
      log.warn('No configuration received from the previous command');
      return 0;
    }

    if (this.explain) {
      this.explainConfigs(pipe);
      return 0;
    }

    const filteredPipe = await this.filterConfigs(pipe);
    const mappedPipe = await this.mapConfigs(filteredPipe);

    if (this.run) {
      this.injectConfigs(mappedPipe);
      return 0;
    }

    const reducedPipe = await this.reduceConfigs(mappedPipe);

    print(reducedPipe);
    return 0;
  }
}
