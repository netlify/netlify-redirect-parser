const { URL } = require('url')

const filterObj = require('filter-obj')

const isInvalidSource = function (path) {
  return path.startsWith('/.netlify')
}

const isUrl = function (pathOrUrl) {
  return SCHEMES.some((scheme) => pathOrUrl.startsWith(scheme))
}

const SCHEMES = ['http://', 'https://']

const isProxy = function ({ status, to }) {
  return status === 200 && isUrl(to)
}

const parseFrom = function (from) {
  if (from === undefined) {
    throw new Error('Missing source path/URL')
  }

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

const isSplatRule = function (path, status) {
  return path.endsWith('/*') && status >= 200 && status < 300
}

const isDefined = function (key, value) {
  return value !== undefined
}

const removeUndefinedValues = function (object) {
  return filterObj(object, isDefined)
}

module.exports = {
  isInvalidSource,
  isProxy,
  isUrl,
  isSplatRule,
  parseFrom,
  removeUndefinedValues,
}
