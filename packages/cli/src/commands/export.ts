import { cwd } from 'process';
import { spawnSync } from 'child_process';
import { Flags, ux } from '@oclif/core';
import _ from 'lodash';
import { TMPL, type EvalCommandReturn, type ExportCommandReturn, EvaluatedConfigOrigin } from '@configu/ts';
import { ExportCommand } from '@configu/node';
import { CONFIG_FORMAT_TYPE, formatConfigs, type ConfigFormat } from '@configu/lib';
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
import { BaseCommand } from '../base';
import { readFile } from '../helpers';

export const NO_CONFIGS_WARNING_TEXT = 'no configuration was fetched';
export const CONFIG_EXPORT_RUN_DEFAULT_ERROR_TEXT = 'could not export configurations';

type TemplateContext = { [key: string]: string } | { key: string; value: string }[];

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

export default class Export extends BaseCommand<typeof Export> {
  static description = `Export \`Configs\` as configuration data in various modes`;

  static examples = [
    {
      description: `Pipe eval commands result to export command to output metadata on the exported \`Configs\``,
      command: `<%= config.bin %> eval ... | <%= config.bin %> <%= command.id %> --explain`,
    },
    {
      description: `Pipe eval commands result to export command to create a Dotenv .env file`,
      command: `<%= config.bin %> eval ... | <%= config.bin %> <%= command.id %> --format 'Dotenv'`,
    },
    {
      description: `Pipe eval commands result to export command to create a Kubernetes ConfigMap .yaml`,
      command: `<%= config.bin %> eval ... | <%= config.bin %> <%= command.id %> --format 'KubernetesConfigMap' --label 'service-prod.yaml'`,
    },
    {
      description: `Pipe eval commands result to export command to render \`Configs\` into a mustache '{{ }}' template file`,
      command: `<%= config.bin %> eval ... | <%= config.bin %> <%= command.id %> --template 'mustache.tmpl.yaml'`,
    },
    {
      description: `Pipe eval commands result to export command to source \`Configs\` as environment variables to the current shell`,
      command: `(set -a; source <(<%= config.bin %> eval ... | <%= config.bin %> <%= command.id %> --source); set +a && <command-that-uses-the-envs>)`,
    },
    {
      description: `Pipe eval commands result to export command to pass \`Configs\` as environment variables to a child-process`,
      command: `<%= config.bin %> eval ... | <%= config.bin %> <%= command.id %> --run 'node index.js'`,
    },
    {
      description: `Pipe eval commands result to export command and apply a prefix / suffix to each Config Key in the export result`,
      command: `<%= config.bin %> eval ... | configu export --prefix "MYAPP_" --suffix "_PROD"`,
    },
    {
      description: `Pipe eval commands result to export command and apply casing to each Config Key in the export result`,
      command: `<%= config.bin %> eval ... | configu export --casing "SnakeCase"`,
    },
    {
      description: `Pipe eval commands result to export command and exclude specific labels`,
      command: `<%= config.bin %> eval ... | configu export --omit-label 'deprecated' --omit-label 'temporary'`,
    },
    {
      description: `Pipe eval commands result to export command and include only configs under specific labels`,
      command: `<%= config.bin %> eval ... |  configu export --pick-label 'production' --pick-label 'secure'`,
    },
    {
      description: `Pipe eval commands result to export command and exclude specific keys`,
      command: `<%= config.bin %> eval ... | configu export --omit-key 'DEBUG_MODE' --omit-key 'TEST_ACCOUNT'`,
    },
    {
      description: `Pipe eval commands result to export command. Include hidden configs and exclude configs with empty values`,
      command: `<%= config.bin %> eval ... | configu export --pick-hidden  --omit-empty`,
    },
  ];

  static flags = {
    explain: Flags.boolean({
      description: `Outputs metadata on the exported \`Configs\``,
      aliases: ['report'],
      exclusive: ['format', 'template', 'source', 'run'],
    }),
    format: Flags.string({
      description: `Format exported \`Configs\` to common configuration formats. Redirect the output to file, if needed`,
      options: CONFIG_FORMAT_TYPE,
      exclusive: ['explain', 'template', 'source', 'run'],
    }),
    label: Flags.string({
      description: `Metadata required in some formats like Kubernetes ConfigMap`,
    }),
    eol: Flags.boolean({
      description: `Adds EOL (\\n on POSIX \\r\\n on Windows) to the end of the stdout`,
      aliases: ['EOL'],
      dependsOn: ['format'],
    }),
    template: Flags.string({
      description: `Path to a file containing {{mustache}} templates to render (inject/substitute) the exported \`Configs\` into`,
      exclusive: ['explain', 'format', 'source', 'run'],
    }),
    'template-input': Flags.string({
      description: `Inject \`Configs\` to template as object or array of \`{key: string, value: string}[]\``,
      options: ['object', 'array'],
      dependsOn: ['template'],
    }),
    // * (set -a; source <(configu export ... --source); set +a && the command)
    source: Flags.boolean({
      description: `Source exported \`Configs\` as environment variables to the current shell`,
      exclusive: ['explain', 'format', 'template', 'run'],
    }),
    run: Flags.string({
      description: `Spawns executable as child-process and pass exported \`Configs\` as environment variables`,
      exclusive: ['explain', 'format', 'template', 'source'],
    }),
    prefix: Flags.string({
      description: `Append a fixed string to the beginning of each Config Key in the export result`,
    }),
    suffix: Flags.string({
      description: `Append a fixed string to the end of each Config Key in the export result`,
    }),
    casing: Flags.string({
      description: `Transforms the casing of Config Keys in the export result to camelCase, PascalCase, Capital Case, snake_case, param-case, CONSTANT_CASE and others`,
      options: Object.keys(casingFormatters),
    }),
    'pick-label': Flags.string({
      description: `Pick a specific label from the previous eval command return to export`,
      multiple: true,
    }),
    'omit-label': Flags.string({
      description: `Omit a specific label from the previous eval command return to export`,
      multiple: true,
    }),
    'pick-key': Flags.string({
      description: `Pick a specific key from the previous eval command return to export`,
      multiple: true,
    }),
    'omit-key': Flags.string({
      description: `Omit a specific key from the previous eval command return to export`,
      multiple: true,
    }),
    'pick-hidden': Flags.boolean({
      description: `Explicitly include config keys marked as hidden. By default, hidden keys are omitted`,
      exclusive: ['omit-hidden'],
    }),
    'omit-hidden': Flags.boolean({
      description: `Explicitly exclude config keys marked as hidden. By default, hidden keys are omitted`,
      exclusive: ['pick-hidden'],
    }),
    'pick-empty': Flags.boolean({
      description: `Include config keys with empty values. By default, empty values are included`,
      exclusive: ['omit-empty'],
    }),
    'omit-empty': Flags.boolean({
      description: `Exclude config keys with empty values. By default, empty values are included`,
      exclusive: ['pick-empty'],
    }),
  };

  printStdout(finalConfigData: string) {
    this.print(finalConfigData, { stdout: 'stdout', eol: this.flags.eol });
  }

  explainConfigs(configs: EvalCommandReturn) {
    const data = _(configs)
      .values()
      .map(({ context: { key }, result: { value, origin, source } }) => ({
        key,
        value,
        origin,
        source,
      }))
      .value();
    ux.table(data, {
      key: { header: 'Key' },
      value: { header: 'Value' },
      origin: { header: 'Origin' },
      source: { header: 'Source' },
    });
  }

  async exportConfigs(configs: ExportCommandReturn, label: string) {
    if (this.flags.template) {
      const templateContent = await readFile(this.flags.template);
      let templateContext: TemplateContext = configs;
      if (this.flags['template-input'] === 'array') {
        templateContext = _(configs)
          .entries()
          .map(([key, value]) => ({
            key,
            value,
          }))
          .value();
      }
      const compiledContent = TMPL.render(templateContent, templateContext);
      this.printStdout(compiledContent);
      return;
    }

    if (this.flags.source) {
      const formattedConfigs = formatConfigs({ format: 'Dotenv', json: configs, label, wrap: true });
      this.printStdout(formattedConfigs);
      return;
    }

    if (this.flags.run) {
      spawnSync(this.flags.run, {
        cwd: cwd(),
        stdio: 'inherit',
        env: { ...configs, ...process.env },
        shell: true,
      });
      return;
    }

    const formattedConfigs = formatConfigs({
      format: (this.flags.format as ConfigFormat) ?? 'JSON',
      json: configs,
      label,
    });
    this.printStdout(formattedConfigs);
  }

  keysMutations() {
    const haskeysMutations = [this.flags.prefix, this.flags.suffix, this.flags.casing].some(
      (flag) => flag !== undefined,
    );
    if (!haskeysMutations) {
      return undefined;
    }

    return (key: string) => {
      const caseFunction = casingFormatters[this.flags.casing ?? ''];
      const keyWithPrefixSuffix = `${this.flags.prefix ?? ''}${key}${this.flags.suffix ?? ''}`;
      return caseFunction ? caseFunction(keyWithPrefixSuffix) : keyWithPrefixSuffix;
    };
  }

  filterFromFlags(): (({ context, result }: EvalCommandReturn['string']) => boolean) | undefined {
    const filterFlags = _.pickBy(this.flags, (value, key) => Object.values(FilterFlag).includes(key as FilterFlag));
    if (_.isEmpty(filterFlags)) {
      return undefined;
    }
    const pickedKeys = (_.pick(filterFlags, [FilterFlag.PickKey])[FilterFlag.PickKey] as string[]) ?? [];
    const pickedLabels = (_.pick(filterFlags, [FilterFlag.PickLabel])[FilterFlag.PickLabel] as string[]) ?? [];
    const omittedKeys = (_.pick(filterFlags, [FilterFlag.OmitKey])[FilterFlag.OmitKey] as string[]) ?? [];
    const omittedLabels = (_.pick(filterFlags, [FilterFlag.OmitLabel])[FilterFlag.OmitLabel] as string[]) ?? [];

    return ({ context, result }: EvalCommandReturn['string']): boolean => {
      const hiddenFilter = this.flags[FilterFlag.PickHidden] ? true : !context.cfgu.hidden;
      const emptyFilter = this.flags[FilterFlag.OmitEmpty] ? result.origin !== EvaluatedConfigOrigin.EmptyValue : true;

      const isKeyPicked = pickedKeys.includes(context.key);
      const isLabelPicked = _.intersection(pickedLabels, context.cfgu.labels ?? []).length > 0;
      const pickFilter = _.isEmpty([...pickedKeys, ...pickedLabels]) || isKeyPicked || isLabelPicked;

      const isKeyOmitted = omittedKeys.includes(context.key);
      const isLabelOmitted = _.intersection(omittedLabels, context.cfgu.labels ?? []).length > 0;
      const omitFilter = !isKeyOmitted && !isLabelOmitted;

      return hiddenFilter && emptyFilter && pickFilter && omitFilter;
    };
  }

  public async run(): Promise<void> {
    const pipe = await this.readPreviousEvalCommandReturn();

    if (_.isEmpty(pipe)) {
      this.warn(NO_CONFIGS_WARNING_TEXT);
      return;
    }

    if (this.flags.explain) {
      this.explainConfigs(pipe);
      return;
    }

    const label = this.flags.label ?? `configs-${Date.now()}`;
    const filter = this.filterFromFlags();
    const keys = this.keysMutations();
    const result = await new ExportCommand({ pipe, env: false, filter, keys }).run();
    await this.exportConfigs(result, label);
  }
}
