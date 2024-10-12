/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: true,
    treeshake: true,
    clean: true,
    keepNames: true,
    // https://github.com/egoist/tsup/issues/939
    outExtension: ({ format }) => {
      switch (format) {
        case 'cjs': {
          return { js: '.cjs', dts: '.d.cts' };
        }
        case 'esm': {
          return { js: '.mjs', dts: '.d.mts' };
        }
        default: {
          return { js: '.js', dts: '.d.ts' };
        }
      }
    },
  },
]);
