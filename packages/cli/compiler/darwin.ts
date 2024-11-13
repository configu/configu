import { execSync } from 'node:child_process';

export function run(filename: string, nodePath: string) {
  // eslint-disable-next-line no-param-reassign
  filename = filename || 'configu';

  execSync('node --experimental-sea-config sea-config.json');
  execSync(`cp ${nodePath} configu`);
  execSync('codesign --remove-signature configu');
  execSync(
    'pnpx postject configu NODE_SEA_BLOB sea-prep.blob ' +
      '    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2' +
      '    --macho-segment-name NODE_SEA',
  );
  execSync('codesign --sign - configu');
  execSync(`mv configu dist/${filename}`);

  return `dist/${filename}`;
}
