/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';
import { $ } from 'zx';

export default defineConfig([
  {
    format: ['esm', 'cjs'],
    outDir: 'dist',
    clean: true,

    // https://www.bundle-buddy.com/esbuild
    metafile: true,

    // https://tsup.egoist.dev/#generate-declaration-file
    dts: true,
    // experimentalDts: true,
    sourcemap: true,

    shims: true,
    treeshake: true,
    splitting: false,
    keepNames: true,

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

    async onSuccess() {
      // todo: try to produce declaration maps
      // https://tsup.egoist.dev/#generate-typescript-declaration-maps--d-ts-map
      // await $`pnpm --package=typescript dlx tsc src/*.ts --emitDeclarationOnly --declarationMap --outDir dist`.pipe(
      //   process.stdout,
      // );
      // console.log('TypeScript declaration files generated.');
    },
  },
]);
