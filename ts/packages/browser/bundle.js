/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const esbuild = require('esbuild');
const { umdWrapper } = require('esbuild-plugin-umd-wrapper');

(async () => {
  const cjsBuildPromise = esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'build',
    bundle: true,
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
  });

  const esmBuildPromise = esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'build',
    bundle: true,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
  });

  const umdBuildPromise = esbuild.build({
    entryPoints: ['./src/index.ts'],
    outfile: './dist/configu.min.js',
    format: 'umd',
    bundle: true,
    sourcemap: true,
    minify: true,
    plugins: [umdWrapper({ libraryName: 'configu' })],
  });

  await Promise.all([cjsBuildPromise, esmBuildPromise, umdBuildPromise]);
})();
