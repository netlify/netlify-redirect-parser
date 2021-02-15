const fs = require('fs')
const { promisify } = require('util')

const common = require('./common')
const Result = require('./result')

const readFileAsync = promisify(fs.readFile)

function splatForwardRule(redirect, nextPart) {
  return redirect.path.match(/\/\*$/) && nextPart.match(common.FORWARD_STATUS_MATCHER)
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

  return [Number.parseInt(source, 10), source.match(/!$/)]
}

function redirectMatch(line) {
  const allParts = line.split(/\s+/).map((el) => el.trim())
  let parts = []
  for (const part in allParts) {
    if (/^#/.test(allParts[part])) {
      break
    }
    parts.push(allParts[part])
  }

  const origin = parts.shift()
  const redirect = common.FULL_URL_MATCHER.test(origin) ? common.parseFullOrigin(origin) : { path: origin }
  if (redirect == null || parts.length === 0) {
    return null
  }

  if (splatForwardRule(redirect, parts[0])) {
    redirect.to = redirect.path.replace(/\/\*$/, '/:splat')
  } else {
    const newHostRuleIdx = parts.findIndex((el) => el.match(/^\//) || el.match(common.FULL_URL_MATCHER))
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

  if (parts.length !== 0) {
    const kv = arrayToObj(parts)
    if (kv.Sign) {
      redirect.signed = kv.Sign
      delete kv.Sign
    }
    if (Object.keys(kv).length !== 0) {
      redirect.conditions = kv
    }
  }

  return redirect
}

async function parse(filePath) {
  const result = new Result()
  const text = await readFileAsync(filePath, 'utf-8')

  text.split('\n').forEach((line, idx) => {
    line = line.trim()
    if (line == '' || /^#/.test(line)) {
      return
    }

    const redirect = redirectMatch(line)
    if (!redirect) {
      result.addError(idx, line)
      return
    }

    if (common.isInvalidSource(redirect)) {
      result.addError(idx, line, {
        reason: 'Invalid /.netlify path in redirect source',
      })
      return
    }

    if (common.isProxy(redirect)) {
      redirect.proxy = true
    }

    result.addSuccess(redirect)
  })

  return result
}

exports.parse = parse
