import { Flags } from '@oclif/core';
import { cwd } from 'process';
import { spawnSync } from 'child_process';
import { BaseCommand } from '../base';

export default class Run extends BaseCommand<typeof Run> {
  static description = `runs a configu script from the scripts section in the .<%= config.bin %> file`;

  static examples = ["<%= config.bin %> <%= command.id %> --script 'some-script'"];

  static flags = {
    script: Flags.string({
      description: `the script property from the scripts section in the .<%= config.bin %> file`,
      required: true,
      char: 's',
    }),
  };

  public async run(): Promise<void> {
    const script = this.config.configData.scripts?.[this.flags.script];

    if (!script) {
      throw new Error(`script ${this.flags.script} is missing`);
    }

    spawnSync(script, {
      cwd: cwd(),
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
  }
}
