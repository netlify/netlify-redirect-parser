const { inspect } = require('util')

// Merge redirects from `_redirects` with the ones from `netlify.toml`.
// When both are specified, both are used and `_redirects` has priority.
// Since in both `netlify.toml` and `_redirects`, only the first matching rule
// is used, it is possible to merge `_redirects` to `netlify.toml` by prepending
// its rules to `netlify.toml` `redirects` field.
// This function implements this logic. It is very simple, but it allows
// changing the merging logic later.
const mergeRedirects = function ({ fileRedirects = [], configRedirects = [] }) {
  validateArray(fileRedirects)
  validateArray(configRedirects)
  return [...fileRedirects, ...configRedirects]
}

const validateArray = function (redirects) {
  if (!Array.isArray(redirects)) {
    throw new TypeError(`Redirects should be an array: ${inspect(redirects, { colors: false })}`)
  }
}

module.exports = { mergeRedirects }
