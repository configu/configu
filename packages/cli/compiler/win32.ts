import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';

export function run(filename = 'configu') {
  execSync('node --experimental-sea-config sea-config.json');
  copyFileSync(`file://${process.execPath}`, 'configu.exe');
  execSync('signtool remove /s configu.exe');
  execSync(
    'pnpx postject configu.exe NODE_SEA_BLOB sea-prep.blob ^' +
      '    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  );
  execSync('signtool sign /fd SHA256 configu.exe');
  execSync(`move configu.exe dist/${filename}.exe`);
}
