const resolveConfig = require('@netlify/config')
const filterObj = require('filter-obj')
const isPlainObj = require('is-plain-obj')

const { addSuccess, addError, isInvalidSource, isProxy, FULL_URL_MATCHER, parseFullOrigin } = require('./common')

function splatForwardRule(path, status, force, to) {
  return path.match(/\/\*$/) && to == null && status && status >= 200 && status < 300 && force
}

function isDefined(key, value) {
  return value !== undefined
}

function redirectMatch({
  status,
  force,
  conditions,
  headers,
  origin,
  from = origin,
  destination,
  to = destination,
  parameters,
  params = parameters,
  query = params,
  signed,
  signing = signed,
  sign = signing,
}) {
  const redirect = from && FULL_URL_MATCHER.test(from) ? parseFullOrigin(from) : { path: from }
  if (redirect == null) {
    return null
  }

  const { host, scheme, path } = redirect
  if (path == null && host == null) {
    return null
  }

  const finalTo = splatForwardRule(path, status, force, to) ? path.replace(/\/\*$/, '/:splat') : to

  if (finalTo == null) {
    return null
  }

  if (headers && !isPlainObj(headers)) {
    return null
  }

  return filterObj(
    { host, scheme, path, to: finalTo, params: query, status, force, conditions, headers, signed: sign },
    isDefined,
  )
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
