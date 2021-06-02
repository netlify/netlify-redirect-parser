const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const { isSplatRule, replaceSplatRule, finalizeRedirect } = require('./common')

// Parse `redirects` field in "netlify.toml" to an array of objects.
// This field is already an array of objects so it only validates and
// normalizes it.
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

// Parse a single `redirects` object
const parseRedirectObject = function ({
  // `from` used to be named `origin`
  origin,
  from = origin,
  // `query` used to be named `params` and `parameters`
  parameters = {},
  params = parameters,
  query = params,
  // `to` used to be named `destination`
  destination,
  to = destination,
  status,
  force = false,
  conditions = {},
  // `signed` used to be named `signing` and `sign`
  sign,
  signing = sign,
  signed = signing,
  headers = {},
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
    query,
    to: finalTo,
    status,
    force,
    conditions,
    signed,
    headers,
  }
}

// Add the optional `to` field when using a forward rule
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
