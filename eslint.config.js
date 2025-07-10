import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import your shared config
const sharedConfig = await import(resolve(__dirname, 'packages/eslint-config/index.js'));

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/public/**',
      'packages/eslint-config/**',
      'packages/prettier-config/**',
    ],
  },
];