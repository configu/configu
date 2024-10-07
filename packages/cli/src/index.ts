import { BaseContext, Builtins, Cli } from 'clipanion';
import * as stdenv from 'std-env';
import { consola } from 'consola';
import packageJson from '../package.json' with { type: 'json' };

import { HelloCommand } from './commands/hello';

export type CustomContext = BaseContext & { stdenv: typeof stdenv; stdio: typeof consola };

export async function run(argv: string[]) {
  consola.wrapAll();

  // const [firstArg, ...restArgs] = argv;

  const cli = new Cli({
    binaryLabel: packageJson.name,
    binaryName: 'configu',
    binaryVersion: packageJson.version,
  });

  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  cli.register(HelloCommand);

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
