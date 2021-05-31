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
  headers = {},
  origin,
  from = origin,
  destination,
  to = destination,
  parameters = {},
  params = parameters,
  query = params,
  sign,
  signing = sign,
  signed = signing,
}) {
  const { scheme, host, path, reason } = parseFrom(from)
  if (reason !== undefined) {
    return { reason }
  }

  if (isInvalidSource(path)) {
    return { reason: '"path" field must not start with "/.netlify"' }
  }

  const finalTo = splatForwardRule(path, status, force, to) ? path.replace(/\/\*$/, '/:splat') : to

  if (finalTo === undefined) {
    return { reason: 'Missing "to" field' }
  }

  if (!isPlainObj(headers)) {
    return { reason: '"headers" field must be an object' }
  }

  return {
    host,
    scheme,
    path,
    to: finalTo,
    query,
    status,
    force,
    conditions,
    headers,
    signed,
  }
}

function parseRedirect(result, obj, idx) {
  if (!isPlainObj(obj)) {
    return addError(result, { lineNum: idx + 1, line: String(obj) })
  }

  const { reason, ...redirect } = redirectMatch(obj)
  if (reason !== undefined) {
    return addError(result, { lineNum: idx + 1, line: JSON.stringify(obj), reason })
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
