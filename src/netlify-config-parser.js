const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const { isSplatRule, replaceSplatRule, finalizeRedirect } = require('./common')

const parseNetlifyConfig = async function (config) {
  const {
    config: { redirects = [] },
  } = await resolveConfig({ config })

  if (!Array.isArray(redirects)) {
    throw new TypeError(`Redirects must be an array not: ${redirects}`)
  }

  return redirects.map(parseRedirect).map(finalizeRedirect)
}

const parseRedirect = function (obj, index) {
  if (!isPlainObj(obj)) {
    throw new TypeError(`Redirects must be objects not: ${obj}`)
  }

  try {
    return parseRedirectObject(obj)
  } catch (error) {
    throw new Error(`Could not parse redirect number ${index + 1}:
  ${JSON.stringify(obj)}
${error.message}`)
  }
}

const parseRedirectObject = function ({
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
  sign,
  signing = sign,
  signed = signing,
}) {
  if (from === undefined) {
    throw new Error('Missing "from" field')
  }

  if (!isPlainObj(headers)) {
    throw new Error('"headers" field must be an object')
  }

  const finalTo = addForwardRule(from, status, to)

  return {
    from,
    to: finalTo,
    query,
    status,
    force,
    conditions,
    headers,
    signed,
  }
}

const addForwardRule = function (from, status, to) {
  if (to !== undefined) {
    return to
  }

  if (!isSplatRule(from, status)) {
    throw new Error('Missing "to" field')
  }

  return replaceSplatRule(from)
}

module.exports = { parseNetlifyConfig }
