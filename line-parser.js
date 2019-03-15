const FULL_URL_MATCHER = /^(https?):\/\/(.+)$/
const FORWARD_STATUS_MATCHER = /^2\d\d!?$/

let URLclass = null

function parseURL(url) {
  if (typeof window !== 'undefined' && window.URL) {
    return new window.URL(url)
  }

  URLclass = URLclass || require('url')
  return URLclass.parse(url)
}

class Result {
  constructor() {
    this.success = []
    this.errors = []
  }

  addSuccess(redirect) {
    this.success.push(redirect)
  }

  addError(idx, line, options) {
    const reason = options && options.reason
    this.errors.push({
      lineNum: idx + 1,
      line,
      reason
    })
  }
}

function parseFullOrigin(origin) {
  let url = null
  try {
    url = parseURL(origin)
  } catch (e) {
    return null
  }

  return { host: url.host, scheme: url.protocol.replace(/:$/, ''), path: url.path }
}

function splatForwardRule(redirect, nextPart) {
  return redirect.path.match(/\/\*$/) && nextPart.match(FORWARD_STATUS_MATCHER)
}

function arrayToObj(source) {
  return source.reduce((obj, condition) => {
    if (condition == null) {
      return obj
    }
    const pair = condition.split('=')
    obj[pair[0]] = pair[1]
    return obj
  }, {})
}

function parseStatus(source) {
  if (source == null) {
    return null
  }

  return [parseInt(source, 10), source.match(/\!$/)]
}

function redirectMatch(line) {
  const allParts = line.split(/\s+/).map(el => el.trim())
  let parts = []
  for (const i in allParts) {
    if (allParts[i].match(/^#/)) {
      break
    }
    parts.push(allParts[i])
  }

  const origin = parts.shift()
  const redirect = origin.match(FULL_URL_MATCHER) ? parseFullOrigin(origin) : { path: origin }
  if (redirect == null || !parts.length) {
    return null
  }

  if (splatForwardRule(redirect, parts[0])) {
    redirect.to = redirect.path.replace(/\/\*$/, '/:splat')
  } else {
    const newHostRuleIdx = parts.findIndex(el => el.match(/^\//) || el.match(FULL_URL_MATCHER))
    if (newHostRuleIdx < 0) {
      return null
    }

    redirect.to = parts[newHostRuleIdx]
    if (newHostRuleIdx > 0) {
      redirect.params = arrayToObj(parts.slice(0, newHostRuleIdx))
    }

    // remove parsed parts for params and host
    parts = parts.slice(newHostRuleIdx + 1)
  }

  if (parts.length === 0) {
    return redirect
  }

  const statusResult = parseStatus(parts.shift())
  if (statusResult) {
    redirect.status = statusResult[0]
    if (statusResult[1]) {
      redirect.force = true
    }
  }

  if (parts.length) {
    const kv = arrayToObj(parts)
    if (kv.Sign) {
      redirect.signed = kv.Sign
      delete kv.Sign
    }
    if (Object.keys(kv).length) {
      redirect.conditions = kv
    }
  }

  return redirect
}

function isInvalidSource(redirect) {
  return redirect.path.match(/^\/\.netlify/)
}

function isProxy(redirect) {
  return redirect.proxy || (redirect.to.match(/^https?:\/\//) && redirect.status === 200)
}

function parse(text) {
  const result = new Result()

  text.split('\n').forEach((line, idx) => {
    line = line.trim()
    if (line == '' || line.match(/^#/)) {
      return
    }

    const redirect = redirectMatch(line)
    if (!redirect) {
      result.addError(idx, line)
      return
    }

    if (isInvalidSource(redirect)) {
      result.addError(idx, line, { reason: 'Invalid /.netlify path in redirect source' })
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
