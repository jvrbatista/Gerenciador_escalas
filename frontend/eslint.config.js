const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactNativePlugin = require('eslint-plugin-react-native');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        __DEV__: 'readonly',
        process: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        globalThis: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        AudioContext: 'readonly',
        AudioBuffer: 'readonly',
        AudioBufferSourceNode: 'readonly',
        AnalyserNode: 'readonly',
        OscillatorNode: 'readonly',
        GainNode: 'readonly',
        MediaStream: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-native': reactNativePlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      // A factory `criarEstilos(colors)` quebra a análise estática desta regra (ela não
      // segue o `styles` vindo do hook) → falso-positivo. Desligada com o tema dinâmico.
      'react-native/no-unused-styles': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // O TypeScript já checa identificadores desconhecidos de forma correta (ciente
      // das libs configuradas, ex. DOM). A regra crua do ESLint não conhece globals/tipos
      // do TS e gera falso positivo em globals de navegador (AudioContext, Audio, etc.).
      'no-undef': 'error',
    },
  },
  {
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  prettierConfig,
  {
    ignores: ['node_modules/', '.expo/', 'dist/', 'web-build/'],
  },
];
