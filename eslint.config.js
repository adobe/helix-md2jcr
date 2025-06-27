import { defineConfig, globalIgnores } from '@eslint/config-helpers';
import { recommended, source, test } from '@adobe/eslint-config-helix';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores([
    '.vscode/*',
    'coverage/*',
    'dist/*',
  ]),
  {
    extends: [recommended],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/extensions': 'off',
    },
    settings: {
      'import/resolver': {
        exports: {},
      },
    },
  },
  source,
  test,
]); 