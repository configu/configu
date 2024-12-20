// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    outDir: 'dist',
    clean: true,

    minify: true,
    keepNames: true,
    treeshake: true,
    splitting: false,

    noExternal: [/(.*)/],
    outExtension: ({ format, pkgType }) => {
      if (pkgType !== 'module' || format !== 'cjs') {
        throw new Error('@configu-store must be an ESM package built as CommonJS bundle');
      }
      return { js: '.cjs' };
    },
  },
]);
