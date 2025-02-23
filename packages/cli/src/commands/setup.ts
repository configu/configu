import { Option } from 'clipanion';
import * as t from 'typanion';
import sea from 'node:sea';
import process from 'node:process';
import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import stream from 'node:stream/promises';
import { addDirToEnvPath } from '@pnpm/os.env.path-extender';
import * as tar from 'tar';
import Zip from 'adm-zip';
import * as prompts from '@clack/prompts';
import { debug, path, stdenv, semver, color, configuFilesApi, pathExists, glob } from '@configu/common';
import { BaseCommand } from './base';
import { tasks } from '../utils';

export class SetupCommand extends BaseCommand {
  static override paths = [['setup']];
  // hide the command from the help menu
  static override usage = undefined;

  global = Option.Boolean('--global', {
    description: `Install the binary globally on the system`,
  });

  version = Option.String('--version', {
    description: `Install a specific version of the binary globally on the system`,
    env: 'CONFIGU_VERSION',
  });

  purge = Option.Boolean('--purge', {
    description: `Purge the cache directory`,
  });

  async execute() {
    const isExecutable = sea.isSea() && process.execPath.endsWith(this.cli.binaryName);
    debug('SetupCommand', { global: this.global, version: this.version, purge: this.purge, isExecutable });

    const isGlobalOrVersionFlag = Boolean(this.global) || Boolean(this.version);
    if (isGlobalOrVersionFlag && !isExecutable) {
      throw new Error('Setup is only supported for executable');
    }

    const output = [];
    let nextExecPath = '';

    prompts.intro(`Configu Setup`);
    await tasks([
      {
        enabled: true,
        title: 'Initializing setup',
        task: async (message) => {
          if (!isGlobalOrVersionFlag && !this.purge) {
            return 'Setup skipped';
          }
          await this.init();
          return 'Setup initialized';
        },
      },
      {
        enabled: Boolean(this.version),
        title: `Installing ${this.version} version`,
        task: async (message) => {
          if (!this.context.isGlobal && !this.global) {
            throw new Error('Version flag is only supported for global setup');
          }

          // default to latest version
          let version = this.version ?? 'latest';
          // handle channel based version
          if (['latest', 'next'].includes(version)) {
            const channelVersion = await configuFilesApi(`/cli/channels/${version}`);
            if (!channelVersion) {
              throw new Error(`Channel ${version} not found`);
            }
            version = channelVersion.data;
          }
          version = version.replace('v', '');
          if (!semver.valid(version)) {
            throw new Error(`Invalid version ${version}`);
          }

          const binDir = path.join(this.context.paths.bin, version);
          nextExecPath = path.join(binDir, this.cli.binaryName);

          const isExecExists = await pathExists(nextExecPath);
          if (isExecExists) {
            return 'Version already installed';
          }

          const hostDist = `${process.platform.replace('32', '')}-${process.arch}`;
          const archiveExt = !stdenv.isWindows ? 'tar.gz' : 'zip';
          const remoteArchive = await configuFilesApi({
            method: 'GET',
            url: `/cli/versions/${version}/${this.cli.binaryName}-v${version}-${hostDist}.${archiveExt}`,
            responseType: 'stream',
          });
          await fs.mkdir(binDir, { recursive: true });
          const archivePath = path.join(binDir, `${this.cli.binaryName}.${archiveExt}`);
          const localArchive = await fs.open(archivePath);
          const writer = localArchive.createWriteStream();
          remoteArchive.data.pipe(writer);
          await stream.finished(writer);
          if (archiveExt === 'tar.gz') {
            await tar.x({ file: archivePath, gzip: true, cwd: binDir });
          } else {
            const zip = new Zip(archivePath);
            zip.extractAllTo(binDir, true);
          }
          return 'Version installed';
        },
      },
      {
        enabled: Boolean(this.global) && !this.version,
        title: 'Copying bin to home directory',
        task: async (message) => {
          if (this.context.isGlobal) {
            return 'Bin is already in home directory';
          }

          const binDir = path.join(this.context.paths.bin, this.cli.binaryVersion as string);
          nextExecPath = path.join(binDir, this.cli.binaryName);

          if (process.execPath === nextExecPath) {
            return 'Bin is already in home directory';
          }

          await fs.mkdir(binDir, { recursive: true });
          await fs.cp(process.execPath, nextExecPath, { force: true });
          return 'Bin copied to home directory';
        },
      },
      {
        enabled: isGlobalOrVersionFlag,
        title: 'Creating bin shims',
        // https://github.com/pnpm/pnpm/blob/main/packages/plugin-commands-setup/src/setup.ts#L67
        task: async (message) => {
          // windows can also use shell script via mingw or cygwin so no filter
          const shellScript = ['#!/bin/sh', `exec ${nextExecPath} "$@"`].join('\n');
          await fs.writeFile(path.join(this.context.paths.home, this.cli.binaryName), shellScript, { mode: 0o755 });

          if (stdenv.isWindows) {
            const batchScript = ['@echo off', `${nextExecPath} %*`].join('\n');
            await fs.writeFile(path.join(this.context.paths.home, `${this.cli.binaryName}.cmd`), batchScript, {
              mode: 0o755,
            });

            const powershellScript = `${nextExecPath} $args`;
            await fs.writeFile(path.join(this.context.paths.home, `${this.cli.binaryName}.ps1`), powershellScript, {
              mode: 0o755,
            });
          }
          return 'Bin shims created';
        },
      },
      {
        enabled: isGlobalOrVersionFlag,
        title: 'Adding bin to PATH',
        task: async (message) => {
          const binEnvPath = await addDirToEnvPath(this.context.paths.home, {
            position: 'start',
            proxyVarName: 'CONFIGU_HOME',
            overwrite: true,
            configSectionName: this.cli.binaryName,
          });
          debug('addDirToEnvPath', binEnvPath);
          if (binEnvPath.configFile?.changeType !== 'skipped') {
            output.push(`Open a new terminal to apply the changes.`);
          }
          return 'Bin added to PATH';
        },
      },
      {
        enabled: Boolean(this.purge),
        title: 'Purging cache directory',
        task: async (message) => {
          await fs.rm(this.context.paths.cache, { recursive: true, force: true });
          // todo: cleanup the bin directory also
          // await fs.rm(this.context.paths.bin, { recursive: true, force: true });
          return 'Cache directory purged';
        },
      },
    ]);

    if (isGlobalOrVersionFlag) {
      output.push(`Run \`${this.cli.binaryName} --help\` to see the available commands.`);
      output.push(`Run \`${this.cli.binaryName} init\` to get started.`);
      prompts.note(output.join('\n'), 'Next steps');
    }

    const outro = [
      `Problems? Open an issue ${color.underline('https://github.com/configu/configu/issues/new/choose')}`,
      `Stuck?    Join our Discord ${color.underline('https://discord.com/invite/cjSBxnB9z8')}`,
    ];
    prompts.outro(outro.join('\n   '));

    await setTimeout(505);
  }
}
