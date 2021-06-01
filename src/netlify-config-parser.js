const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const { isInvalidSource, isProxy, parseFrom, isSplatRule, removeUndefinedValues } = require('./common')

const splatForwardRule = function (path, status, force, to) {
  return to === undefined && force && isSplatRule(path, status)
}

const redirectMatch = function ({
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
  edge_handlers: edgeHandlers = [],
  sign,
  signing = sign,
  signed = signing,
}) {
  const { scheme, host, path } = parseFrom(from)

  if (isInvalidSource(path)) {
    throw new Error('"path" field must not start with "/.netlify"')
  }

  const finalTo = splatForwardRule(path, status, force, to) ? path.replace(/\/\*$/, '/:splat') : to

  if (finalTo === undefined) {
    throw new Error('Missing "to" field')
  }

  if (!isPlainObj(headers)) {
    throw new Error('"headers" field must be an object')
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
    edgeHandlers,
    signed,
  }
}

const parseRedirect = function (obj, index) {
  if (!isPlainObj(obj)) {
    throw new Error(`Redirects must be objects not: ${obj}`)
  }

  try {
    const redirect = redirectMatch(obj)
    return removeUndefinedValues({ ...redirect, proxy: isProxy(redirect) })
  } catch (error) {
    throw new Error(`Could not parse redirect number ${index + 1}:
  ${JSON.stringify(obj)}
${error.message}`)
  }
}

const parseNetlifyConfig = async function (config) {
  const {
    config: { redirects = [] },
  } = await resolveConfig({ config })
  return redirects.map(parseRedirect)
}

module.exports = { parseNetlifyConfig }
