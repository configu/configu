import { cwd } from 'process';
import { spawnSync } from 'child_process';
import { Flags, ux } from '@oclif/core';
import _ from 'lodash';
import { TMPL, type EvalCommandReturn, EvaluatedConfigOrigin, type ExportCommandReturn } from '@configu/ts';
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
import { type FlagToken } from '@oclif/core/lib/interfaces/parser';
import { BaseCommand } from '../base';
import { readFile } from '../helpers';

export const NO_CONFIGS_WARNING_TEXT = 'no configuration was fetched';
export const CONFIG_EXPORT_RUN_DEFAULT_ERROR_TEXT = 'could not export configurations';

type TemplateContext = { [key: string]: string } | { key: string; value: string }[];

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
    empty: Flags.boolean({
      description: `Omits all empty (non-value) from the exported \`Configs\``,
      default: true,
      allowNo: true,
    }),
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
      description: `Explicitly include config keys marked as hidden. By default, hidden keys are omitted.`,
      exclusive: ['omit-hidden'],
    }),
    'omit-hidden': Flags.boolean({
      description: `Explicitly exclude config keys marked as hidden. By default, hidden keys are omitted.`,
      exclusive: ['pick-hidden'],
    }),
    'pick-empty': Flags.boolean({
      description: `Include config keys with empty values. By default, empty values are included.`,
      exclusive: ['omit-empty'],
    }),
    'omit-empty': Flags.boolean({
      description: `Exclude config keys with empty values. By default, empty values are included.`,
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
    if ([this.flags.prefix, this.flags.suffix].some((flag) => flag !== undefined)) {
      return (key: string) => {
        let mutatedKey = key;
        if (this.flags.prefix) mutatedKey = `${this.flags.prefix}${mutatedKey}`;
        if (this.flags.suffix) mutatedKey = `${mutatedKey}${this.flags.suffix}`;
        return mutatedKey;
      };
    }
    return undefined;
  }

  applyCasing(result: { [key: string]: string }) {
    const caseFunction = casingFormatters[this.flags.casing ?? ''];
    return caseFunction ? _.mapKeys(result, (value, key) => caseFunction(key)) : result;
  }

  filterFromFlags(): (({ context, result }: EvalCommandReturn['string']) => boolean) | undefined {
    const filterFlags = _.filter(this.rawFlags, ({ flag }) => flag.startsWith('pick') || flag.startsWith('omit'));
    if (filterFlags.length > 0) {
      const hiddenFlags = _.remove(filterFlags, ({ flag }) => ['omit-hidden', 'pick-hidden'].includes(flag));
      const emptyFlags = _.remove(filterFlags, ({ flag }) => ['omit-empty', 'pick-empty'].includes(flag));
      const labelsFlags = _.remove(filterFlags, ({ flag }) => ['omit-label', 'pick-label'].includes(flag));
      const keysFlags = _.remove(filterFlags, ({ flag }) => ['omit-key', 'pick-key'].includes(flag));
      const labelsRules = _.reduce<FlagToken, { [label: string]: boolean }>(
        labelsFlags,
        (rules, { flag, input }) => {
          const [flagAction]: string[] = flag.split('-');
          return flagAction === 'pick' ? { ...rules, [input]: true } : { ...rules, [input]: false };
        },
        {},
      );
      const keysRules = _.reduce<FlagToken, { [key: string]: boolean }>(
        keysFlags,
        (rules, { flag, input }) => {
          const [flagAction]: string[] = flag.split('-');
          return flagAction === 'pick' ? { ...rules, [input]: true } : { ...rules, [input]: false };
        },
        {},
      );
      return ({ context, result }: EvalCommandReturn['string']): boolean => {
        const hiddenFilter = hiddenFlags.some((flagToken) => flagToken.flag === 'pick-hidden')
          ? true
          : !context.cfgu.hidden;
        const emptyFilter = emptyFlags.some((flagToken) => flagToken.flag === 'omit-empty') ? !!result.value : true;
        const labelFilter =
          Object.keys(labelsRules).length > 0
            ? _.reduce(
                labelsRules,
                (filter, action, label) => {
                  const isConfigLabeled = (context.cfgu.labels ?? []).includes(label);
                  if (action) {
                    if ((context.cfgu.labels ?? []).length > 0) {
                      return filter || isConfigLabeled;
                    }
                    return false;
                  }

                  return filter || !isConfigLabeled;
                },
                false,
              )
            : true;

        const keyFilter =
          Object.keys(keysRules).length > 0
            ? _.reduce(
                keysRules,
                (filter, action, key) => {
                  const isConfigKey = context.key === key;
                  return action ? filter || isConfigKey : !isConfigKey;
                },
                false,
              )
            : true;
        return hiddenFilter && emptyFilter && labelFilter && keyFilter;
      };
    }
    return undefined;
  }

  public async run(): Promise<void> {
    let pipe = await this.readPreviousEvalCommandReturn();

    if (_.isEmpty(pipe)) {
      this.warn(NO_CONFIGS_WARNING_TEXT);
      return;
    }

    if (!this.flags.empty) {
      pipe = _.omitBy(pipe, ({ result: { origin } }) => origin === EvaluatedConfigOrigin.EmptyValue);
    }

    if (this.flags.explain) {
      this.explainConfigs(pipe);
      return;
    }

    const label = this.flags.label ?? `configs-${Date.now()}`;
    const filter = this.filterFromFlags();
    const keys = this.keysMutations();
    const result = await new ExportCommand({ pipe, env: false, filter, keys }).run();
    const caseFormattedResult = this.applyCasing(result);
    await this.exportConfigs(caseFormattedResult, label);
  }
}
