import { build } from 'esbuild';

console.log('Building @configu/cli...');

await build({
  entryPoints: ['src/configu.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  outdir: 'dist',
  outExtension: { '.js': '.cjs' },
  define: {
    'import.meta.url': 'importMetaUrl',
  },
  inject: ['cjs_shims.js'],
  minify: true,
  keepNames: true,
  external: [], // Bundle everything for CLI
  metafile: true,
  treeShaking: true,
  splitting: false,
});

console.log('✅ @configu/cli built successfully');
