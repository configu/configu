// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig, Options } from 'tsup';
import { readdir, readFile } from 'node:fs/promises';
import { platform } from 'node:os';

const osName = process.env.OS_NAME || platform();

export default defineConfig(async (): Promise<Options | Options[]> => {
  const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
  const noExternal = Object.keys(pkg.dependencies).filter((dep) => !dep.startsWith('@configu'));

  const files = await readdir('src');

  return {
    entry: files.filter((file) => file.endsWith('.ts') && !file.includes('.test.')).map((file) => `src/${file}`),
    target: 'esnext',
    format: 'esm',
    noExternal,
    outDir: `../../dist`,
    outExtension: () => ({
      js: `.os-${osName}.js`,
    }),
  };
});
