/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/run.ts'],
    format: 'cjs',
    // dts: true,
    clean: true,
    minify: true,
    // splitting: true,
    treeshake: true,
    noExternal: [/(.*)/],
    // https://github.com/egoist/tsup/issues/939
    // outExtension: () => {
    //   return { js: '.js', dts: '.d.ts' };
    // },
  },
]);
