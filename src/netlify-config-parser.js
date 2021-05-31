const resolveConfig = require('@netlify/config')
const isPlainObj = require('is-plain-obj')

const { redirectMatch, isInvalidSource, isProxy, addError, addSuccess } = require('./common')

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
