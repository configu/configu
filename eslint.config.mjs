import { defineConfig, globalIgnores } from 'eslint/config';
import { includeIgnoreFile } from '@eslint/compat';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import { importX } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import cspell from '@cspell/eslint-plugin/recommended';
import prettier from 'eslint-plugin-prettier/recommended';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  globalIgnores(['examples/**/*', 'eslint.config.mjs', 'docs/prepare.mjs']),
  js.configs.recommended,
  ts.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
  },
  cspell,
  prettier,
  {
    files: ['**/*.{js,ts,mjs,cjs,cts,mts}'],
    languageOptions: {
      globals: {
        ...globals['shared-node-browser'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'import-x/namespace': ['error', { allowComputed: true }],
    },
  },
]);
