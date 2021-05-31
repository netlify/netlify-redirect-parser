const { URL } = require('url')

function addSuccess(result, object) {
  return { ...result, success: [...result.success, object] }
}

function addError(result, object) {
  return { ...result, errors: [...result.errors, object] }
}

function isInvalidSource(redirect) {
  return redirect.path.match(/^\/\.netlify/)
}

function isProxy(redirect) {
  return Boolean(redirect.proxy || (/^https?:\/\//.test(redirect.to) && redirect.status === 200))
}

const FULL_URL_MATCHER = /^(https?):\/\/(.+)$/

function parseFullOrigin(origin) {
  try {
    const { host, protocol, pathname } = new URL(origin)
    const scheme = protocol.slice(0, -1)
    return { host, scheme, path: pathname }
  } catch (error) {
    return null
  }
}

module.exports = {
  addSuccess,
  addError,
  isInvalidSource,
  isProxy,
  FULL_URL_MATCHER,
  parseFullOrigin,
}
