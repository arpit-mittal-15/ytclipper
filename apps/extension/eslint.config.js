import config from '@ytclipper/eslint-config/react.js';

export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Extension-specific overrides
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['createTimestampCollector'],
        },
      ],
    },
    languageOptions: {
      globals: {
        chrome: 'readonly',
        browser: true,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
