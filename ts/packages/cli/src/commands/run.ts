import { cwd } from 'process';
import { spawnSync } from 'child_process';
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
  };

  public async run(): Promise<void> {
    const script = this.config.cli.data.scripts?.[this.flags.script];

    if (!script) {
      throw new Error(`Script "${this.flags.script}" is missing`);
    }

    spawnSync(script, {
      cwd: cwd(),
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
  }
}
