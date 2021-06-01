const { URL } = require('url')

const filterObj = require('filter-obj')

const isProxy = function ({ status, to }) {
  return status === 200 && isUrl(to)
}

const parseFrom = function (from) {
  if (from === undefined) {
    throw new Error('Missing source path/URL')
  }

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

const isSplatRule = function (path, status) {
  return path.endsWith('/*') && status >= 200 && status < 300
}

const removeUndefinedValues = function (object) {
  return filterObj(object, isDefined)
}

const isDefined = function (key, value) {
  return value !== undefined
}

module.exports = {
  isProxy,
  isUrl,
  isSplatRule,
  parseFrom,
  removeUndefinedValues,
}
