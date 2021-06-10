const { URL } = require('url')

const filterObj = require('filter-obj')
const isPlainObj = require('is-plain-obj')

const { isUrl } = require('./url')

// Validate and normalize an array of `redirects` objects.
// This step is performed after `redirects` have been parsed from either
// `netlify.toml` or `_redirects`.
const normalizeRedirects = function (redirects) {
  if (!Array.isArray(redirects)) {
    throw new TypeError(`Redirects must be an array not: ${redirects}`)
  }

  return redirects.map(parseRedirect)
}

const parseRedirect = function (obj, index) {
  if (!isPlainObj(obj)) {
    throw new TypeError(`Redirects must be objects not: ${obj}`)
  }

  try {
    return parseRedirectObject(obj)
  } catch (error) {
    throw new Error(`Could not parse redirect number ${index + 1}:
  ${JSON.stringify(obj)}
${error.message}`)
  }
}

// Parse a single `redirects` object
const parseRedirectObject = function ({
  // `from` used to be named `origin`
  origin,
  from = origin,
  // `query` used to be named `params` and `parameters`
  parameters = {},
  params = parameters,
  query = params,
  // `to` used to be named `destination`
  destination,
  to = destination,
  status,
  force = false,
  conditions = {},
  // `signed` used to be named `signing` and `sign`
  sign,
  signing = sign,
  signed = signing,
  headers = {},
}) {
  if (from === undefined) {
    throw new Error('Missing "from" field')
  }

  if (!isPlainObj(headers)) {
    throw new Error('"headers" field must be an object')
  }

  const finalTo = addForwardRule(from, status, to)
  const { scheme, host, path } = parseFrom(from)
  const proxy = isProxy(status, finalTo)

  return removeUndefinedValues({
    scheme,
    host,
    path,
    query,
    to: finalTo,
    status,
    force,
    conditions,
    signed,
    headers,
    proxy,
  })
}

// Add the optional `to` field when using a forward rule
const addForwardRule = function (from, status, to) {
  if (to !== undefined) {
    return to
  }

  if (!isSplatRule(from, status)) {
    throw new Error('Missing "to" field')
  }

  return from.replace(SPLAT_REGEXP, '/:splat')
}

// "to" can only be omitted when using forward rules:
//  - This requires "from" to end with "/*" and "status" to be 2**
//  - "to" will then default to "from" but with "/*" replaced to "/:splat"
const isSplatRule = function (from, status) {
  return from.endsWith('/*') && status >= 200 && status < 300
}

const SPLAT_REGEXP = /\/\*$/

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

const isProxy = function (status, to) {
  return status === 200 && isUrl(to)
}

const removeUndefinedValues = function (object) {
  return filterObj(object, isDefined)
}

const isDefined = function (key, value) {
  return value !== undefined
}

module.exports = { normalizeRedirects }