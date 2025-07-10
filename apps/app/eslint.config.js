import reactConfig from '@ytclipper/eslint-config/react.js';

export default [
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
  },
];
