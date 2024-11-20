import test, { describe } from 'node:test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import * as os from 'node:os';
import { existsSync } from 'node:fs';
import { downloadFile } from '../download-file';

describe('installation', () => {
  test('should install', async () => {
    // get current dir path
    const currentDir = path.dirname(import.meta.url);
    const parentDir = path.join(currentDir, '../..').replace('file:', '');
    const installationDir = path.join(parentDir, 'tmp');
    let ext = '';
    let prefix = '';
    let cwd = installationDir;
    if (os.platform() === 'win32') {
      const exeUrl = `https://github.com/configu/configu/releases/download/cli%2Fv${process.env.CONFIGU_VERSION}/configu-${os.platform()}-${os.arch()}.exe`;
      await downloadFile(exeUrl, path.join(installationDir, 'configu.exe'));
      assert.ok(existsSync(path.join(installationDir, 'configu.exe')), 'Download failed');
      await fs.chmod(path.join(installationDir, 'configu.exe'), 0o755);
      ext = '.exe';
    } else {
      const installScript = path.join(parentDir, 'install.sh');
      await fs.chmod(installScript, 0o755);
      const result = execSync('./install.sh', {
        cwd: parentDir,
        env: {
          CONFIGU_VERSION: process.env.CONFIGU_VERSION,
          CONFIGU_INSTALL: installationDir,
        },
      }).toString();
      assert.match(result, /Configu was installed successfully to/, 'Installation script failed');
      prefix = './';
      cwd = path.join(installationDir, 'bin');
    }

    const configuExec = execSync(`${prefix}configu${ext} --help`, { cwd }).toString();

    assert.match(configuExec, /@configu\/cli/, 'Configu executable failed to run');
    assert.match(configuExec, /General commands/);
  });
});
