import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';

/**
 * Searches the installed Windows SDKs for the most recent signtool.exe version
 * Taken from https://github.com/dlemstra/code-sign-action
 * @returns Path to most recent signtool.exe (x86 version)
 */
async function getSigntoolLocation() {
  const windowsKitsFolder = 'C:/Program Files (x86)/Windows Kits/10/bin/';
  const folders = await readdir(windowsKitsFolder);
  let fileName = '';
  let maxVersion = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const folder of folders) {
    if (!folder.endsWith('.0')) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const folderVersion = parseInt(folder.replace(/\./g, ''), 10);
    if (folderVersion > maxVersion) {
      const signtoolFilename = `${windowsKitsFolder}${folder}/x64/signtool.exe`;
      try {
        // eslint-disable-next-line no-await-in-loop
        const statVal = await stat(signtoolFilename);
        if (statVal.isFile()) {
          fileName = signtoolFilename;
          maxVersion = folderVersion;
        }
      } catch {
        console.warn('Skipping %s due to error.', signtoolFilename);
      }
    }
  }
  if (fileName === '') {
    throw new Error(`Unable to find signtool.exe in ${windowsKitsFolder}`);
  }

  console.log(`Signtool location is ${fileName}.`);
  return fileName;
}

export async function run(filename = 'configu') {
  execSync('node --experimental-sea-config sea-config.json');
  copyFileSync(process.execPath, 'configu.exe');
  execSync(`"${await getSigntoolLocation()}" remove /s configu.exe`);
  execSync(
    'pnpx postject configu.exe NODE_SEA_BLOB sea-prep.blob ^' +
      '    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  );
  execSync('signtool sign /fd SHA256 configu.exe');
  execSync(`move configu.exe dist/${filename}.exe`);
}
