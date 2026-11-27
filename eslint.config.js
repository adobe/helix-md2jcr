import { defineConfig, globalIgnores } from '@eslint/config-helpers';
import { recommended, source, test } from '@adobe/eslint-config-helix';
import importPlugin from 'eslint-plugin-import';
import noUnescapedXmlAttr from './eslint-rules/no-unescaped-xml-attr.js';

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
      local: {
        rules: {
          'no-unescaped-xml-attr': noUnescapedXmlAttr,
        },
      },
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
  {
    files: ['src/mdast2jcr/hb/**/*.js'],
    rules: {
      'local/no-unescaped-xml-attr': 'error',
    },
  },
]);