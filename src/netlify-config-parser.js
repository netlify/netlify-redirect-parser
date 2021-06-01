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
  force = false,
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
  if (from === undefined) {
    throw new Error('Missing "from" field')
  }

  const { scheme, host, path } = parseFrom(from)

  const finalTo = addForwardRule(path, status, to)

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

const addForwardRule = function (path, status, to) {
  if (to !== undefined) {
    return to
  }

  if (!isSplatRule(path, status)) {
    throw new Error('Missing "to" field')
  }

  return replaceSplatRule(path)
}

module.exports = { parseNetlifyConfig }
