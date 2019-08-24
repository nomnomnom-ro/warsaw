module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/react',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  plugins: ['@typescript-eslint', 'react', 'import', 'react-hooks', 'prettier'],
  rules: {
    'prettier/prettier': [
      1,
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ],

    '@typescript-eslint/no-angle-bracket-type-assertion': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react/default-props-match-prop-types': 'off',
    'react/jsx-filename-extension': 'off',
    'react/jsx-wrap-multilines': 'off',
    'react/require-default-props': 'off',
    'react/sort-comp': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-props-no-spreading': 'off',
    'react/static-property-placement': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'jsx-a11y/accessible-emoji': 2,
  },
};
