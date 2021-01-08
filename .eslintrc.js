const { overrides } = require('@netlify/eslint-config-node')

module.exports = {
  extends: '@netlify/eslint-config-node',
  rules: {
    // Those rules from @netlify/eslint-config-node are currently disabled
    // TODO: remove, so those rules are enabled
    'fp/no-mutating-methods': 0,
    'fp/no-class': 0,
    'fp/no-this': 0,
    'fp/no-mutation': 0,
    'fp/no-let': 0,
    'fp/no-loops': 0,
    'fp/no-delete': 0,
    'node/exports-style': 0,
    'func-style': 0,
    'no-magic-numbers': 0,
    'max-lines': 0,
    'max-statements': 0,
    complexity: 0,
    eqeqeq: 0,
    radix: 0,
    'prefer-destructuring': 0,
    'no-param-reassign': 0,
    'unicorn/prefer-string-starts-ends-with': 0,
    // TODO: harmonize with filename snake_case in other Netlify Dev projects
    'unicorn/filename-case': [2, { case: 'kebabCase' }],
  },
  overrides: [...overrides],
}
