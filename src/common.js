const isPlainObj = require('lodash.isplainobject')

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

function splatForwardRule(path, obj, dest) {
  return path.match(/\/\*$/) && dest == null && obj.status && obj.status >= 200 && obj.status < 300 && obj.force
}

function fetch(obj, options) {
  for (const option in options) {
    if (Object.prototype.hasOwnProperty.call(obj, options[option])) {
      return obj[options[option]]
    }
  }
  return null
}

function redirectMatch(obj) {
  const origin = fetch(obj, ['from', 'origin'])
  const redirect = origin && exp.FULL_URL_MATCHER.test(origin) ? exp.parseFullOrigin(origin) : { path: origin }
  if (redirect == null || (redirect.path == null && redirect.host == null)) {
    return null
  }

  const dest = fetch(obj, ['to', 'destination'])
  if (splatForwardRule(redirect.path, obj, dest)) {
    redirect.to = redirect.path.replace(/\/\*$/, '/:splat')
  } else {
    redirect.to = dest
  }

  if (redirect.to == null) {
    return null
  }

  redirect.params = fetch(obj, ['query', 'params', 'parameters'])
  redirect.status = fetch(obj, ['status'])
  redirect.force = fetch(obj, ['force'])
  redirect.conditions = fetch(obj, ['conditions'])
  redirect.headers = fetch(obj, ['headers'])
  redirect.signed = fetch(obj, ['sign', 'signing', 'signed'])

  Object.keys(redirect).forEach((key) => {
    if (redirect[key] === null) {
      delete redirect[key]
    }
  })

  if (redirect.headers && !isPlainObj(redirect.headers)) {
    return null
  }

  return redirect
}

const exp = {
  splatForwardRule,
  isPlainObj,
  redirectMatch,

  FULL_URL_MATCHER: /^(https?):\/\/(.+)$/,
  FORWARD_STATUS_MATCHER: /^2\d\d!?$/,

  isInvalidSource(redirect) {
    return redirect.path.match(/^\/\.netlify/)
  },
  isProxy(redirect) {
    return redirect.proxy || (redirect.to.match(/^https?:\/\//) && redirect.status === 200)
  },
  parseFullOrigin(origin) {
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
  },
}

module.exports = exp