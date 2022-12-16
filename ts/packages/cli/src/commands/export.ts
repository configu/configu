import { Flags } from '@oclif/core';
import _ from 'lodash';
import { paramCase } from 'change-case';
import { EvaluatedConfigs, EvaluatedConfigsArray, TMPL } from '@configu/ts';
import { Set, Cfgu, EvalCommand } from '@configu/node';
import {
  CONFIG_FORMAT_TYPE,
  formatConfigs,
  ConfigFormat,
  CONFIG_SYNCHRONIZER_TYPE,
  ConfigSynchronizer,
} from '@configu/lib';
import { BaseCommand } from '../base';
import { constructStoreFromConnectionString } from '../helpers/stores';
import { SYNCHRONIZERS_FLAGS_DICT, syncIntegration } from '../helpers/synchronizers';

export const NO_CONFIGS_WARNING_TEXT = 'no configuration was fetched';
export const CONFIG_EXPORT_RUN_DEFAULT_ERROR_TEXT = 'could not export configurations';
export default class Export extends BaseCommand {
  static description = 'exports configurations on demand and in multiple forms';

  static examples = [
    '<%= config.bin %> <%= command.id %> --store "configu" --store "secrets" --set "prod" --schema "./node-srv.cfgu.json" --format "Dotenv"',
    '<%= config.bin %> <%= command.id %> --schema "./node-srv.cfgu.json" --defaults --no-empty',
  ];

  static flags = {
    store: Flags.string({
      description: 'config-stores to fetch configurations from',
      exclusive: ['defaults'],
      multiple: true,
      default: [],
    }),
    defaults: Flags.boolean({
      description: 'only use the defaults property from the schema to export configurations',
      exclusive: ['store'],
      aliases: ['use-defaults'],
    }),

    set: Flags.string({
      description: 'hierarchy of the configs',
      default: '',
    }),
    schema: Flags.string({
      description: 'path to a <schema>.cfgu.[json|yaml] files',
      required: true,
      multiple: true,
    }),

    label: Flags.string({
      description: 'metadata required in some formats like k8s ConfigMaps',
    }),
    empty: Flags.boolean({
      description: 'omits all non-value configurations in the current set',
      default: true,
      allowNo: true,
    }),

    format: Flags.string({
      description:
        'format configurations to some common configurations formats. (redirect the output to file, if needed)',
      options: CONFIG_FORMAT_TYPE,
      exclusive: ['template', 'source', 'sync'],
    }),

    template: Flags.string({
      description: 'path to a mustache based template to inject configurations into',
      exclusive: ['format', 'source', 'sync'],
    }),
    'template-input': Flags.string({
      description: 'inject configurations to template as object or array or formatted string',
      options: ['object', 'array', 'string'],
      dependsOn: ['template'],
    }),

    // * https://medium.com/@charles.wautier/pipe-a-dotenv-in-a-process-with-the-shell-f9c663ff99a0
    // * (set -a; source .env; set +a; the command)
    // * https://docs.doppler.com/docs/accessing-secrets#how-do-i-export-doppler-secrets-into-the-current-shell
    // * (set -a; source <(configu export ... --source); set +a && the command)
    source: Flags.boolean({
      description: 'source configurations to the current shell',
      exclusive: ['format', 'template', 'sync'],
    }),

    sync: Flags.string({
      description: 'syncs configurations to a 3rd party runtime environment',
      options: CONFIG_SYNCHRONIZER_TYPE,
      exclusive: ['format', 'template', 'source'],
    }),
    ...SYNCHRONIZERS_FLAGS_DICT,
  };

  printStdout(finalConfigData: string) {
    this.log(finalConfigData, 'stdout');
  }

  async exportConfigs(configs: EvaluatedConfigs, label: string) {
    if (_.isEmpty(configs)) {
      this.warn(NO_CONFIGS_WARNING_TEXT);
      return;
    }
    const { flags } = await this.parse(Export);

    if (flags.template) {
      const templateContent = await this.readFile(flags.template);
      let templateContext: EvaluatedConfigs | EvaluatedConfigsArray = configs;
      if (flags['template-input'] === 'array') {
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

    if (flags.source) {
      const formattedConfigs = formatConfigs({ format: 'Dotenv', json: configs, label });
      this.printStdout(formattedConfigs);
      return;
    }

    if (flags.sync) {
      await syncIntegration({ synchronizer: flags.sync as ConfigSynchronizer, configs, flags });
      return;
    }

    const formattedConfigs = formatConfigs({
      format: (flags.format as ConfigFormat) ?? 'JSON',
      json: configs,
      label,
    });
    this.printStdout(formattedConfigs);
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Export);

    if (flags.defaults) {
      flags.store = ['store=noop'];
      flags.set = '';
    }

    const storePromises = flags.store.map(async (storeFlag) => {
      const storeCS = this.config.configData.stores?.[storeFlag] ?? storeFlag;
      const { store } = await constructStoreFromConnectionString(storeCS);
      return store;
    });
    const store = await Promise.all(storePromises);

    const set = new Set(flags.set);
    const schema = flags.schema.map((schemaFlag) => {
      return new Cfgu(schemaFlag);
    });

    let { data } = await new EvalCommand({
      store,
      set,
      schema,
    }).run();

    if (!flags.empty) {
      data = _.omitBy(data, (v) => v === '');
    }

    const label = flags.label ?? paramCase(`${set.path} ${_.map(schema, 'name')}`);

    await this.exportConfigs(data, label);
  }
}
