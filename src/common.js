const { URL } = require('url')

const filterObj = require('filter-obj')

function isInvalidSource(path) {
  return path.startsWith('/.netlify')
}

function isUrl(pathOrUrl) {
  return SCHEMES.some((scheme) => pathOrUrl.startsWith(scheme))
}

const SCHEMES = ['http://', 'https://']

function isProxy({ status, to }) {
  return status === 200 && isUrl(to)
}

function parseFrom(from) {
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

function isSplatRule(path, status) {
  return path.endsWith('/*') && status >= 200 && status < 300
}

function isDefined(key, value) {
  return value !== undefined
}

function removeUndefinedValues(object) {
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
