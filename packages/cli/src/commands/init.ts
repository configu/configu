import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { setTimeout } from 'node:timers/promises';
import * as prompts from '@clack/prompts';
import { path, AllowedExtensions, CfguFile, ConfiguFile } from '@configu/common';
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
        { value: 'greet', label: 'Hello, World! Schema', hint: `./greet.cfgu.${format}` },
        { value: 'features', label: 'Fully Featured Schema', hint: `./features.cfgu.${format}` },
        {
          value: 'project',
          label: 'Project Skeleton',
          hint: `./.configu + ./common.cfgu.${format} + ./service.cfgu.${format}`,
        },
      ],
    });

    const spinner = prompts.spinner();
    spinner.start(`Generating assets from ${preset.toString()} preset`);

    if (preset === 'greet') {
      const file = new CfguFile(
        path.join(process.cwd(), `./greet.cfgu.${format}`),
        {
          $schema: CfguFile.schema.$id,
          keys: {
            GREETING: {
              enum: ['hello', 'hey', 'welcome', 'hola', 'salute', 'bonjour', 'shalom', 'marhabaan'],
              default: 'hello',
            },
            SUBJECT: { default: 'world' },
            MESSAGE: {
              description: 'A full greeting message',
              const: '{{ $.configs.GREETING.value }}, {{ $.configs.SUBJECT.value }}!',
            },
          },
        },
        format,
      );
      await file.save({});
    } else if (preset === 'features') {
      const file = new CfguFile(
        path.join(process.cwd(), `./features.cfgu.${format}`),
        {
          $schema: CfguFile.schema.$id,
          keys: {},
        },
        format,
      );
      await file.save({});
    } else if (preset === 'project') {
      const configu = new ConfiguFile(
        path.join(process.cwd(), `./.configu`),
        {
          $schema: ConfiguFile.schema.$id,
          stores: {},
          schemas: {
            common: './common.cfgu.yaml',
            service: './service.cfgu.yaml',
          },
          scripts: {},
        },
        format,
      );
      const common = new CfguFile(path.join(process.cwd(), `./common.cfgu.${format}`), {}, format);
      const service = new CfguFile(path.join(process.cwd(), `./service.cfgu.${format}`), {}, format);
      await Promise.all([configu.save({}), common.save({}), service.save({})]);
    }

    spinner.stop(`Assets generated`, 0);

    prompts.outro("You're all set!");
    await setTimeout(505);
  }
}
