const { URL } = require('url')

const filterObj = require('filter-obj')

// "to" can only be omitted when using forward rules:
//  - This requires "from" to end with "/*" and "status" to be 2**
//  - "to" will then default to "from" but with "/*" replaced to "/:splat"
const isSplatRule = function (from, status) {
  return from.endsWith('/*') && status >= 200 && status < 300
}

const replaceSplatRule = function (from) {
  return from.replace(SPLAT_REGEXP, '/:splat')
}

const SPLAT_REGEXP = /\/\*$/

// Applies logic at the end of both `_redirects` and `netlify.toml` parsing
const finalizeRedirect = function ({ from, ...redirect }) {
  const { scheme, host, path } = parseFrom(from)
  const proxy = isProxy(redirect)
  return removeUndefinedValues({ ...redirect, scheme, host, path, proxy })
}

// Parses the `from` field which can be either a file path or a URL.
const parseFrom = function (from) {
  const { scheme, host, path } = parseFromField(from)
  if (path.startsWith('/.netlify')) {
    throw new Error('"path" field must not start with "/.netlify"')
  }

  return { scheme, host, path }
}

const parseFromField = function (from) {
  if (!isUrl(from)) {
    return { path: from }
  }

  try {
    const { host, protocol, pathname: path } = new URL(from)
    const scheme = protocol.slice(0, -1)
    return { scheme, host, path }
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`)
  }
}

const isUrl = function (pathOrUrl) {
  return SCHEMES.some((scheme) => pathOrUrl.startsWith(scheme))
}

const SCHEMES = ['http://', 'https://']

const isProxy = function ({ status, to }) {
  return status === 200 && isUrl(to)
}

const removeUndefinedValues = function (object) {
  return filterObj(object, isDefined)
}

const isDefined = function (key, value) {
  return value !== undefined
}

module.exports = {
  isUrl,
  isSplatRule,
  replaceSplatRule,
  finalizeRedirect,
}
