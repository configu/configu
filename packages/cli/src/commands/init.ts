import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { setTimeout } from 'node:timers/promises';
import * as prompts from '@clack/prompts';
import { path, AllowedExtensions, CfguFile, ConfiguFile, CfguFileContents, ConfiguFileContents } from '@configu/common';
import { BaseCommand } from './base';

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: `Initialize Configu assets from a variety of presets`,
  });

  // start = Option.Boolean('--start,--quick-start,--get-started,--getting-started,--hello-world', {
  //   description: `Generate a \`Getting Started\` .cfgu file`,
  // });

  format = Option.String('--format', 'yaml', {
    description: `Assets output format`,
    validator: t.isEnum(AllowedExtensions),
  });

  async execute() {
    prompts.intro(`Configu Initializer`);
    await this.init();

    const format: CfguFile['contentsType'] = this.format === 'json' ? 'json' : 'yaml';

    const preset = await prompts.select({
      message: 'Pick a preset.',
      options: [
        { value: 'greet', label: 'Hello, World! Schema', hint: `greet.cfgu.${format}` },
        { value: 'features', label: 'Fully Featured Schema', hint: `features.cfgu.${format}` },
        {
          value: 'starter',
          label: 'Starter Pack',
          hint: `.configu + starter.cfgu.${format}`,
        },
        {
          value: 'complete',
          label: 'Complete Pack',
          hint: `.configu + {common,api,worker}.cfgu.${format} + ./module.ts`,
        },
        {
          value: 'module',
          label: 'Configu Module',
          hint: `./module.ts + ./package.json`,
        },
      ],
    });

    const spinner = prompts.spinner();
    spinner.start(`Generating assets from ${preset.toString()} preset`);

    if (preset === 'greet') {
      const GreetSchema: CfguFileContents = {
        $schema: CfguFile.schema.$id,
        keys: {
          GREETING: {
            enum: ['hello', 'hey', 'welcome', 'hola', 'salute', 'bonjour', 'shalom', 'marhabaan'],
            default: 'hello',
          },
          SUBJECT: {
            test: 'validator.isLength($.value, { min: 1, max: 100 })',
            default: 'world',
          },
          MESSAGE: {
            description: 'A full greeting message',
            const: '{{ $.configs.GREETING.value }}, {{ $.configs.SUBJECT.value }}!',
          },
        },
      };
      const greet = new CfguFile(path.join(process.cwd(), `./greet.cfgu.${format}`), GreetSchema, format);
      await greet.save({});
    } else if (preset === 'features') {
      const FeaturesSchema: CfguFileContents = {
        $schema: CfguFile.schema.$id,
        keys: {},
      };
      const features = new CfguFile(path.join(process.cwd(), `./features.cfgu.${format}`), FeaturesSchema, format);
      await features.save({});
    } else if (preset === 'starter') {
      const ProjectConfigu: ConfiguFileContents = {
        $schema: ConfiguFile.schema.$id,
        stores: {
          csv: {
            type: 'csv-file',
            configuration: {
              path: './configs.csv',
            },
          },
        },
        schemas: {
          app: './app.cfgu.yaml',
        },
        scripts: {
          local: "configu eval --defaults --schema 'app' | configu export --format 'env' > .env",
          deploy: "configu eval --set '$CONFIGU_SET' --schema 'app'",
          'deploy:explain': "configu run --script 'deploy' | configu export --explain",
          'deploy:k8s':
            "configu run --script 'deploy' | configu export --format 'k8s-config-map' > k8s-config-map.yaml",
        },
      };
      const configu = new ConfiguFile(path.join(process.cwd(), `./.configu`), ProjectConfigu, format);
      const AppSchema: CfguFileContents = {
        $schema: CfguFile.schema.$id,
        keys: {
          APP_ENV: {
            description: 'Defines the environment in which the application runs',
            enum: ['development', 'production', 'test'],
            default: 'development',
          },
          APP_LOG_LEVEL: {
            description: 'Defines the level of logs to be recorded',
            enum: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
            default: 'info',
          },
          APP_PORT: {
            description: 'Defines the port on which the application listens',
            test: 'validator.isPort($.value)',
            default: 3000,
          },
          SERVICE_ENDPOINT: {
            description: 'Defines the endpoint for the service',
            test: 'validator.isURL($.value)',
            required: true,
          },
        },
      };
      const service = new CfguFile(path.join(process.cwd(), `./service.cfgu.${format}`), AppSchema, format);

      await Promise.all([configu.save({}), service.save({})]);
    }

    spinner.stop(`Assets generated`, 0);

    prompts.outro("You're all set!");
    await setTimeout(505);
  }
}
