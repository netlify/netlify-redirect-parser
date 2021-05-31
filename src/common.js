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

let URLclass = null

function parseURL(url) {
  /* eslint-disable node/no-unsupported-features/node-builtins */
  if (typeof window !== 'undefined' && window.URL) {
    return new window.URL(url)
    /* eslint-enable node/no-unsupported-features/node-builtins */
  }

  // eslint-disable-next-line node/global-require
  URLclass = URLclass || require('url')
  return new URLclass.URL(url)
}

function parseFullOrigin(origin) {
  let url = null
  try {
    url = parseURL(origin)
  } catch (error) {
    return null
  }

  return {
    host: url.host,
    scheme: url.protocol.replace(/:$/, ''),
    path: url.pathname,
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
