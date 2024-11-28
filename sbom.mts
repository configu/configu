/* eslint-disable import/no-extraneous-dependencies */

import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'zx';
import ignore from 'ignore';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));

const ignorePatterns = ['**/node_modules', '**/*.md', '**/build', '**/dist', '**/out', '**/tmp'];

(async () => {
  try {
    const ig = ignore().add(ignorePatterns);
    const dest = process.env.SBOM_DEST ?? path.resolve(tmpdir('configu'));

    await fs.cp(rootDir, dest, {
      recursive: true,
      filter: (srcPath) => {
        const relativePath = path.relative(rootDir, srcPath);
        return !relativePath || !ig.ignores(relativePath);
      },
    });
    console.log(`SBOM copied successfully to ${dest}`);
  } catch (err) {
    console.error('Error copying files:', err);
  }
})();
