const { overrides } = require('@netlify/eslint-config-node')

module.exports = {
  extends: ['plugin:fp/recommended', '@netlify/eslint-config-node'],
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    'fp/no-mutation': [2, { commonjs: true }],
    'import/extensions': [2, 'ignorePackages'],
  },
  overrides: [...overrides],
}
