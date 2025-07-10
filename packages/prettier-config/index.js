export default {
  // Basic formatting - STRICT
  semi: true, // Mandatory semicolons
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',

  // Indentation and spacing - STRICT
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  bracketSpacing: true, // { hello } instead of {hello}

  // JSX formatting - STRICT
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Other formatting options - STRICT
  arrowParens: 'always', // (x) => x instead of x => x
  bracketSameLine: false,
  endOfLine: 'lf',
  insertPragma: false,
  proseWrap: 'preserve',
  requirePragma: false,
  embeddedLanguageFormatting: 'auto',

  // File-specific overrides
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 120,
        proseWrap: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
        trailingComma: 'none',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },
  ],
};
