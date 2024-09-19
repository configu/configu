import { Flags } from '@oclif/core';
import { BaseCommand } from '../base';

export default class Run extends BaseCommand<typeof Run> {
  static description = `Run a script from the scripts section in the .<%= config.bin %> file`;

  static examples = [
    {
      description: `Run 'my-script' from the scripts section in the .<%= config.bin %> file`,
      command: `<%= config.bin %> <%= command.id %> --script 'my-script'`,
    },
  ];

  static flags = {
    script: Flags.string({
      description: `The script property from the scripts section in the .<%= config.bin %> file`,
      required: true,
      char: 's',
    }),
    dir: Flags.string({
      description: `Set the directory where the script is being executed. The default is the location of the .<%= config.bin %> file`,
      aliases: ['cwd'],
      char: 'd',
    }),
  };

  public async run(): Promise<void> {
    this.configuFile.runScript({ scriptName: this.flags.script, directory: this.flags.dir });
  }
}
