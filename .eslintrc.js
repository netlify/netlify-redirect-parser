const { overrides } = require('@netlify/eslint-config-node')

module.exports = {
  extends: ['plugin:fp/recommended', '@netlify/eslint-config-node'],
  rules: {
    'fp/no-mutation': [2, { commonjs: true }],
  },
  overrides: [...overrides],
}
