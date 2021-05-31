const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const { addSuccess, addError, isInvalidSource, isProxy, parseFrom, removeUndefinedValues } = require('./common')

function splatForwardRule(path, status, force, to) {
  return path.endsWith('/*') && to === undefined && status >= 200 && status < 300 && force
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
  parameters,
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

  return removeUndefinedValues({
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
  })
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

async function parseNetlifyConfig(config) {
  const {
    config: { redirects = [] },
  } = await resolveConfig({ config })
  return redirects.reduce(parseRedirect, { success: [], errors: [] })
}

module.exports = { parseNetlifyConfig }
