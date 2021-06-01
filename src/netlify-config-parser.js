const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const { parseFrom, isSplatRule, replaceSplatRule, finalizeRedirect } = require('./common')

const parseNetlifyConfig = async function (config) {
  const {
    config: { redirects = [] },
  } = await resolveConfig({ config })
  return redirects.map(parseRedirect).map(finalizeRedirect)
}

const parseRedirect = function (obj, index) {
  if (!isPlainObj(obj)) {
    throw new Error(`Redirects must be objects not: ${obj}`)
  }

  try {
    return redirectMatch(obj)
  } catch (error) {
    throw new Error(`Could not parse redirect number ${index + 1}:
  ${JSON.stringify(obj)}
${error.message}`)
  }
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

  const finalTo = splatForwardRule(path, status, to) ? replaceSplatRule(path) : to

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

const splatForwardRule = function (path, status, to) {
  return to === undefined && isSplatRule(path, status)
}

module.exports = { parseNetlifyConfig }
