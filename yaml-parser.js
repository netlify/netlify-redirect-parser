const Result = require('./result')
const {
  isPlainObj,
  redirectMatch,
  isInvalidSource,
  isProxy,
} = require('./common')
const yaml = require('yamljs')

function parse(source) {
  const result = new Result()
  const config = yaml.parse(source)

  if (!Array.isArray(config.redirects)) {
    return result
  }

  config.redirects.forEach((obj, idx) => {
    if (!isPlainObj(obj)) {
      result.addError(idx, obj)
      return
    }

    const redirect = redirectMatch(obj)
    if (!redirect) {
      result.addError(idx, JSON.stringify(obj))
      return
    }

    if (isInvalidSource(redirect)) {
      result.addError(idx, JSON.stringify(obj), {
        reason: 'Invalid /.netlify path in redirect source',
      })
      return
    }

    if (isProxy(redirect)) {
      redirect.proxy = true
    }

    result.addSuccess(redirect)
  })

  return result
}

exports.parse = parse
