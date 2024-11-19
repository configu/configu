/* NOTE:
 * @configu/cli is currently work in progress and is not yet released.
 * It expected to be released by the end of October 2024.
 * Latest released code can be found at: https://github.com/configu/configu/tree/52cee9c41fb03addc4c0983028e37df42945f5b7/packages/cli
 */

import { BaseContext, Builtins, Cli } from 'clipanion';
import * as stdenv from 'std-env';
import { consola } from 'consola';
import packageJson from '../package.json' with { type: 'json' };

// import { HelloCommand } from './commands/hello';
import { EvalCommand } from './commands/eval';
import { CliExportCommand } from './commands/export';
import { InitCommand } from './commands/init';
import { LoginCommand } from './commands/login';
import { RunCommand } from './commands/run';
import { TestCommand } from './commands/test';
import { UpsertCommand } from './commands/upsert';
import { GenerateCommand } from './commands/generate';

export type CustomContext = BaseContext & { stdenv: typeof stdenv; stdio: typeof consola };

export async function run(argv: string[]) {
  // consola.wrapAll();

  // const [firstArg, ...restArgs] = argv;

  const cli = new Cli({
    binaryLabel: packageJson.name,
    binaryName: 'configu',
    binaryVersion: packageJson.version,
  });

  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  cli.register(EvalCommand);
  cli.register(CliExportCommand);
  cli.register(InitCommand);
  cli.register(LoginCommand);
  cli.register(RunCommand);
  cli.register(TestCommand);
  cli.register(UpsertCommand);
  cli.register(GenerateCommand);

  const context = {
    ...Cli.defaultContext,
    stdenv,
    stdio: consola,
  };

  const code = await cli.run(argv, context);

  if (code !== 0) {
    process.exitCode ??= code;
  }
}
