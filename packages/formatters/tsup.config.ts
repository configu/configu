/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    outDir: 'dist',
    clean: true,

    dts: true,
    sourcemap: true,

    keepNames: true,
    treeshake: true,
    splitting: true,

    outExtension({ format }) {
      // https://github.com/egoist/tsup/issues/939
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
