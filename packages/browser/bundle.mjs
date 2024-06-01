/* eslint-disable import/no-extraneous-dependencies */

import esbuild from 'esbuild';
import { umdWrapper } from 'esbuild-plugin-umd-wrapper';

const ENTRY_POINT = 'src/index.ts';
const OUT_DIR = 'dist';

const cjsBuildPromise = esbuild.build({
  entryPoints: [ENTRY_POINT],
  outdir: OUT_DIR,
  format: 'cjs',
  bundle: true,
  outExtension: { '.js': '.cjs' },
});

const esmBuildPromise = esbuild.build({
  entryPoints: [ENTRY_POINT],
  outdir: OUT_DIR,
  format: 'esm',
  bundle: true,
  outExtension: { '.js': '.mjs' },
});

// https://github.com/Inqnuam/esbuild-plugin-umd-wrapper
const umdBuildPromise = esbuild.build({
  entryPoints: [ENTRY_POINT],
  outfile: `${OUT_DIR}/configu.min.js`,
  format: 'umd',
  bundle: true,
  sourcemap: true,
  minify: true,
  plugins: [umdWrapper({ libraryName: 'configu' })],
});

await Promise.all([cjsBuildPromise, esmBuildPromise, umdBuildPromise]);
