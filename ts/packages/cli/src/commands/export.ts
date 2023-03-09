import { Flags, ux } from '@oclif/core';
import querystring from 'querystring';
import { cwd } from 'process';
import { spawnSync } from 'child_process';
import _ from 'lodash';
import { TMPL, EvaluatedConfigs, EvalCommandParameters, EvalCommandConfigsParameter } from '@configu/ts';
import { ConfigSet, ConfigSchema, NoopStore, EvalCommand } from '@configu/node';
import { CONFIG_FORMAT_TYPE, formatConfigs, ConfigFormat } from '@configu/lib';
import { BaseCommand } from '../base';
import { constructStoreFromConnectionString, reduceConfigFlag } from '../helpers';

export const NO_CONFIGS_WARNING_TEXT = 'no configuration was fetched';
export const CONFIG_EXPORT_RUN_DEFAULT_ERROR_TEXT = 'could not export configurations';

type TemplateContext = { [key: string]: string } | { key: string; value: string }[];

export default class Export extends BaseCommand<typeof Export> {
  static description = 'exports configurations on demand and in multiple forms';

  static examples = [
    '<%= config.bin %> <%= command.id %> --from "store=configu;set=production;schema=./get-started.cfgu.json" --from "store=configu;set=my-service;schema=./my-service.cfgu.json;K=V" --config "K=V" --format "Dotenv"',
    '<%= config.bin %> <%= command.id %> --from "schema=./node-srv.cfgu.json" --no-empty',
  ];

  static flags = {
    from: Flags.string({
      description: 'connection string to fetch configurations from',
      required: true,
      multiple: true,
    }),
    config: Flags.string({
      description: 'key=value pairs to override fetched configurations',
      multiple: true,
      char: 'c',
    }),

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

  async exportConfigs(configs: EvaluatedConfigs, label: string) {
    if (_.isEmpty(configs)) {
      this.warn(NO_CONFIGS_WARNING_TEXT);
      return;
    }

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

  async constructEvalCommandParameters(): Promise<EvalCommandParameters> {
    const fromPromises = this.flags.from.map(async (fromFlag, idx) => {
      const { store, set, schema, ...configs } = querystring.parse(fromFlag, ';');
      if (typeof schema !== 'string') {
        throw new Error(`schema is missing at --from[${idx}]`);
      }

      Object.entries(configs).forEach(([key, value]) => {
        if (typeof value !== 'string') {
          throw new Error(`config value is missing at --from[${idx}].${key}`);
        }
      });

      if (typeof store === 'string' && (typeof set === 'string' || typeof set === 'undefined')) {
        const storeCS = this.config.configData.stores?.[store] ?? store;
        const { store: storeInstance } = await constructStoreFromConnectionString(storeCS);
        return {
          store: storeInstance,
          set: new ConfigSet(set),
          schema: new ConfigSchema(schema),
          configs: configs as EvalCommandConfigsParameter,
        };
      }

      return {
        store: new NoopStore(),
        set: new ConfigSet(),
        schema: new ConfigSchema(schema),
        configs: configs as EvalCommandConfigsParameter,
      };
    });

    const from = await Promise.all(fromPromises);
    const configs = reduceConfigFlag(this.flags.config);

    return { from, configs };
  }

  public async run(): Promise<void> {
    const evalCommandParameters = await this.constructEvalCommandParameters();
    const evalCommandReturn = await new EvalCommand(evalCommandParameters).run();

    if (this.flags.explain) {
      const data = _(evalCommandReturn.metadata)
        .values()
        .map(({ key, value, result: { from } }) => ({
          key,
          value,
          source: from.source,
          which: from.which,
        }))
        .value();
      ux.table(data, {
        key: { header: 'Key' },
        value: { header: 'Value' },
        source: { header: 'Source' },
        which: { header: 'Which' },
      });
      return;
    }

    let { result } = evalCommandReturn;
    if (!this.flags.empty) {
      result = _.omitBy(result, (v) => v === '');
    }
    const label = this.flags.label ?? this.flags.from.join('>');
    await this.exportConfigs(result, label);
  }
}
