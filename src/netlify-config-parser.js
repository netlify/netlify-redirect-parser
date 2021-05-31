const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const { addSuccess, addError, isInvalidSource, isProxy, FULL_URL_MATCHER, parseFullOrigin } = require('./common')

function fetch(obj, options) {
  for (const option in options) {
    if (Object.prototype.hasOwnProperty.call(obj, options[option])) {
      return obj[options[option]]
    }
  }
  return null
}

function splatForwardRule(path, obj, dest) {
  return path.match(/\/\*$/) && dest == null && obj.status && obj.status >= 200 && obj.status < 300 && obj.force
}

function redirectMatch(obj) {
  const origin = fetch(obj, ['from', 'origin'])
  const redirect = origin && FULL_URL_MATCHER.test(origin) ? parseFullOrigin(origin) : { path: origin }
  if (redirect == null || (redirect.path == null && redirect.host == null)) {
    return null
  }

  const dest = fetch(obj, ['to', 'destination'])
  redirect.to = splatForwardRule(redirect.path, obj, dest) ? redirect.path.replace(/\/\*$/, '/:splat') : dest

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

function parseRedirect(result, obj, idx) {
  if (!isPlainObj(obj)) {
    return addError(result, { lineNum: idx + 1, line: String(obj) })
  }

  const redirect = redirectMatch(obj)
  if (!redirect) {
    return addError(result, { lineNum: idx + 1, line: JSON.stringify(obj) })
  }

  if (isInvalidSource(redirect)) {
    return addError(result, {
      lineNum: idx + 1,
      line: JSON.stringify(obj),
      reason: 'Invalid /.netlify path in redirect source',
    })
  }

  return addSuccess(result, { ...redirect, proxy: isProxy(redirect) })
}

async function parse(config) {
  const {
    config: { redirects = [] },
  } = await resolveConfig({ config })

  return redirects.reduce(parseRedirect, { success: [], errors: [] })
}

exports.parse = parse
