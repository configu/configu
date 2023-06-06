import { Flags, ux } from '@oclif/core';
import { cwd } from 'process';
import { spawnSync } from 'child_process';
import _ from 'lodash';
import { TMPL, EvalCommandReturn, EvaluatedConfigOrigin, ExportCommandReturn } from '@configu/ts';
import { ExportCommand } from '@configu/node';
import { CONFIG_FORMAT_TYPE, formatConfigs, ConfigFormat } from '@configu/lib';
import { BaseCommand } from '../base';

export const NO_CONFIGS_WARNING_TEXT = 'no configuration was fetched';
export const CONFIG_EXPORT_RUN_DEFAULT_ERROR_TEXT = 'could not export configurations';

type TemplateContext = { [key: string]: string } | { key: string; value: string }[];

export default class Export extends BaseCommand<typeof Export> {
  static description = 'exports configs as configuration data in multiple modes';

  static examples = ["<%= config.bin %> eval ... | <%= config.bin %> <%= command.id %> --format 'Dotenv'"];

  static flags = {
    label: Flags.string({
      description: 'metadata required in some formats like k8s ConfigMaps',
    }),
    empty: Flags.boolean({
      description: 'omits all non-value configurations in the current set',
      default: true,
      allowNo: true,
    }),

    explain: Flags.boolean({
      description: 'outputs metadata on the exported configurations',
      aliases: ['report'],
      exclusive: ['format', 'template', 'source', 'run'],
    }),

    format: Flags.string({
      description:
        'format configurations to some common configurations formats. (redirect the output to file, if needed)',
      options: CONFIG_FORMAT_TYPE,
      exclusive: ['explain', 'template', 'source', 'run'],
    }),

    template: Flags.string({
      description: 'path to a mustache based template to inject configurations into',
      exclusive: ['explain', 'format', 'source', 'run'],
    }),
    'template-input': Flags.string({
      description: 'inject configurations to template as object or array or formatted string',
      options: ['object', 'array'],
      dependsOn: ['template'],
    }),

    // * (set -a; source <(configu export ... --source); set +a && the command)
    source: Flags.boolean({
      description: 'source configurations to the current shell',
      exclusive: ['explain', 'format', 'template', 'run'],
    }),

    run: Flags.string({
      description: 'spawns executable as child-process and passes configurations as environment variables',
      exclusive: ['explain', 'format', 'template', 'source'],
    }),
  };

  printStdout(finalConfigData: string) {
    this.log(finalConfigData, undefined, 'stdout');
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
      const templateContent = await this.readFile(this.flags.template);
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

  public async run(): Promise<void> {
    let previous = await this.readPreviousEvalCommandReturn();

    if (_.isEmpty(previous)) {
      this.warn(NO_CONFIGS_WARNING_TEXT);
      return;
    }

    if (!this.flags.empty) {
      previous = _.omitBy(previous, ({ result: { origin } }) => origin === EvaluatedConfigOrigin.EmptyValue);
    }

    if (this.flags.explain) {
      this.explainConfigs(previous);
      return;
    }

    const label = this.flags.label ?? `configs-${Date.now()}`;
    const result = await new ExportCommand({ data: previous, env: false }).run();
    await this.exportConfigs(result, label);
  }
}
