const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const {
  addSuccess,
  addError,
  isInvalidSource,
  isProxy,
  parseFrom,
  isSplatRule,
  removeUndefinedValues,
} = require('./common')

function splatForwardRule(path, status, force, to) {
  return to === undefined && force && isSplatRule(path, status)
}

function redirectMatch({
  status,
  force,
  conditions = {},
  headers,
  origin,
  from = origin,
  destination,
  to = destination,
  parameters = {},
  params = parameters,
  query = params,
  signed,
  signing = signed,
  sign = signing,
}) {
  const { scheme, host, path } = parseFrom(from)
  if (path === undefined) {
    return null
  }

  const finalTo = splatForwardRule(path, status, force, to) ? path.replace(/\/\*$/, '/:splat') : to

  if (finalTo == null) {
    return null
  }

  if (headers && !isPlainObj(headers)) {
    return null
  }

  return {
    host,
    scheme,
    path,
    to: finalTo,
    params: query,
    status,
    force,
    conditions,
    headers,
    signed: sign,
  }
}

function parseRedirect(result, obj, idx) {
  if (!isPlainObj(obj)) {
    return addError(result, { lineNum: idx + 1, line: String(obj) })
  }

  const redirect = redirectMatch(obj)
  if (!redirect) {
    return addError(result, { lineNum: idx + 1, line: JSON.stringify(obj) })
  }

  if (isInvalidSource(redirect.path)) {
    return addError(result, {
      lineNum: idx + 1,
      line: JSON.stringify(obj),
      reason: 'Invalid /.netlify path in redirect source',
    })
  }

  return addSuccess(result, removeUndefinedValues({ ...redirect, proxy: isProxy(redirect) }))
}

async function parseNetlifyConfig(config) {
  const {
    config: { redirects = [] },
  } = await resolveConfig({ config })
  return redirects.reduce(parseRedirect, { success: [], errors: [] })
}

module.exports = { parseNetlifyConfig }
