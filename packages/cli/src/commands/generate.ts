import { Command, Option } from 'clipanion';
import { BaseCommand } from './base';

export class GenerateCommand extends BaseCommand {
  static override paths = [['generate']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: `create an integration module in the specified directory, ready to be injected into the system.`,
  });

  directory = Option.String('--dir,--d', {
    description: `The directory where the integration module will be created`,
  });

  integrationName = Option.String('--name,--n', {
    description: `The name of the integration module`,
  });

  async execute() {
    const directory = this.directory || process.cwd();
    const integrationName = this.integrationName || 'integration';
    process.stdout.write(`directory: ${directory}\n`);
    process.stdout.write(`integrationName: ${integrationName}\n`);
  }
}
