const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        require: 'readonly',
        module:  'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        fetch:  'readonly',
        global: 'readonly',
        // Jest globals
        describe: 'readonly',
        test:     'readonly',
        expect:   'readonly',
        beforeEach: 'readonly',
        jest:     'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
