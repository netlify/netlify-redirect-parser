const { overrides } = require('@netlify/eslint-config-node/.eslintrc_esm.cjs')

module.exports = {
  extends: ['plugin:fp/recommended', '@netlify/eslint-config-node/.eslintrc_esm.cjs'],
  rules: {
    'fp/no-mutation': [2, { commonjs: true }],
  },
  overrides: [...overrides],
}
