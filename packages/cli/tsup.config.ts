/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/configu.ts'],
    format: 'cjs',
    outDir: 'dist',
    clean: true,
    metafile: true,
    minify: true,
    shims: true,
    treeshake: true,
    splitting: false,
    keepNames: true,
    removeNodeProtocol: false,

    noExternal: [/(.*)/],
    outExtension: ({ format, pkgType }) => {
      if (pkgType !== 'module' || format !== 'cjs') {
        throw new Error('@configu/cli must be an ESM package built as CommonJS bundle');
      }
      return { js: '.cjs' };
    },
  },
]);
