import test, { describe } from 'node:test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert';
import fs from 'node:fs/promises';

describe('installation', () => {
  test('should install', async () => {
    // get current dir path
    const currentDir = path.dirname(import.meta.url);
    const parentDir = path.join(currentDir, '../..').replace('file:', '');
    const installationDir = path.join(parentDir, 'tmp');

    await fs.chmod('./install.sh', 0o755);

    const result = execSync('./install.sh', {
      cwd: parentDir,
      env: {
        CONFIGU_VERSION: process.env.CONFIGU_VERSION,
        CONFIGU_INSTALL: installationDir,
      },
    }).toString();

    assert.match(result, /Configu was installed successfully to/, 'Installation script failed');

    const configuExec = execSync('./configu --help', {
      cwd: path.join(installationDir, 'bin'),
    }).toString();

    assert.match(configuExec, /@configu\/cli/, 'Configu executable failed to run');
    assert.match(configuExec, /General commands/);
  });
});
