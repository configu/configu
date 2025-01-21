/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    outDir: 'dist',
    clean: true,

    dts: true,
    sourcemap: true,

    keepNames: true,
    treeshake: true,
    splitting: false,

    noExternal: ['@configu/common'],
    outExtension: ({ format, pkgType }) => {
      // if (pkgType !== 'module' || format !== 'esm') {
      //   throw new Error('@configu/proxy must be an ESM package built as ESM bundle');
      // }
      return { js: '.cjs' };
    },
  },
]);
