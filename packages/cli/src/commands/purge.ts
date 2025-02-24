import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import * as prompts from '@clack/prompts';
import { BaseCommand } from './base';

export class PurgeCommand extends BaseCommand {
  static override paths = [['purge']];
  // hide the command from the help menu
  static override usage = undefined;

  private canRun() {
    if (this.context.isExecutable && this.context.isExecFromHome) {
      return;
    }
    throw new Error(`${this.constructor.name} is only supported for executable running from home directory`);
  }

  async execute() {
    this.canRun();

    const spinner = prompts.spinner();
    spinner.start(`Purging cache directory`);

    try {
      await fs.rm(this.context.paths.cache, { recursive: true, force: true });
      // todo: cleanup the bin directory also
      // await fs.rm(this.context.paths.bin, { recursive: true, force: true });

      spinner.stop(`Cache directory purged`, 0);
      await setTimeout(505);
    } catch (error) {
      spinner.stop(`Failed to purge cache directory`, 1);
      throw error;
    }
  }
}
