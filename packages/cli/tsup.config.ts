/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/run.ts'],
    format: 'cjs',
    outDir: 'dist',
    clean: true,

    minify: true,
    keepNames: true,
    treeshake: true,
    splitting: false,

    noExternal: [/(.*)/],
    outExtension: () => {
      // https://github.com/egoist/tsup/issues/939
      return { js: '.js', dts: '.d.ts' };
    },
  },
]);
