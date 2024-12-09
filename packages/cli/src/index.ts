import { Cli, Builtins } from 'clipanion';
import { validateNodejsVersion, console } from '@configu/common';

import packageJson from '../package.json' with { type: 'json' };

// Config Management Commands
import { CliUpsertCommand } from './commands/upsert';
import { CliEvalCommand } from './commands/eval';
import { CliExportCommand } from './commands/export';

// Misc Commands
// import { InitCommand } from './commands/init';
// import { UpdateCommand } from './commands/update';
import { LoginCommand } from './commands/login';
import { RunCommand } from './commands/run';

// inspired by
// https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-cli/sources/lib.ts#L186
// https://github.com/nodejs/corepack/blob/main/sources/main.ts#L40
export async function run(argv: string[]) {
  console.debug('argv', argv);

  const cli = new Cli({
    binaryName: 'configu',
    binaryLabel: packageJson.name,
    binaryVersion: packageJson.version,
  });

  // enables the BaseCommand catch override functionality
  const originalErrorMethod = cli.error;
  cli.error = (...args) => {
    if (typeof args[0] === 'number') {
      return '';
    }
    return originalErrorMethod(...args);
  };

  function unexpectedTerminationHandler() {
    console.error(
      `${cli.binaryName} is terminating due to an unexpected empty event loop.\nPlease report this issue at https://github.com/configu/configu/issues.`,
    );
  }
  process.once(`beforeExit`, unexpectedTerminationHandler);
  process.on('exit', (code) => {
    console.debug(`Exiting with code: ${code}`);
    if (code !== 0) {
      console.print(`CONFIGU_EXIT_CODE=${code}`);
    }
  });

  try {
    // await validateNodejsVersion();

    cli.register(Builtins.HelpCommand);
    cli.register(Builtins.VersionCommand);

    cli.register(CliUpsertCommand);
    cli.register(CliEvalCommand);
    cli.register(CliExportCommand);

    // cli.register(InitCommand);
    // cli.register(UpdateCommand);
    cli.register(LoginCommand);
    cli.register(RunCommand);

    process.exitCode = 42;
    // cli.run() never throws
    // https://github.com/arcanis/clipanion/blob/master/sources/advanced/Cli.ts#L483
    process.exitCode = await cli.run(argv);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    process.off(`beforeExit`, unexpectedTerminationHandler);
  }
}
