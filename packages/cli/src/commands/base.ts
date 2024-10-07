import { Command, Option } from 'clipanion';
import { ConfiguFile } from '@configu/common';
import { type CustomContext } from '../index';

export type Context = CustomContext & { configu: ConfiguFile };

export abstract class BaseCommand extends Command<Context> {
  public async init(): Promise<void> {
    const configu = await ConfiguFile.search();
    this.context.configu = configu;
  }
}
