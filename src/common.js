const { URL } = require('url')

const filterObj = require('filter-obj')

function addSuccess(result, object) {
  return { ...result, success: [...result.success, object] }
}

function addError(result, object) {
  return { ...result, errors: [...result.errors, object] }
}

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
    return { reason: 'Missing source path/URL' }
  }

  if (!isUrl(from)) {
    return { path: from }
  }

  try {
    const { host, protocol, pathname: path } = new URL(from)
    const scheme = protocol.slice(0, -1)
    return { scheme, host, path }
  } catch (error) {
    return { reason: `Invalid URL: ${error.message}` }
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
  addSuccess,
  addError,
  isInvalidSource,
  isProxy,
  isUrl,
  isSplatRule,
  parseFrom,
  removeUndefinedValues,
}
