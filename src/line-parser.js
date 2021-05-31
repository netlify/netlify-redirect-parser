const fs = require('fs')
const { promisify } = require('util')

const { addSuccess, addError, isInvalidSource, isProxy, FULL_URL_MATCHER, parseFullOrigin } = require('./common')

const readFileAsync = promisify(fs.readFile)

const FORWARD_STATUS_MATCHER = /^2\d\d!?$/

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

const COMMENT_REGEXP = /(^|\s)#.*/u

function trimComment(line) {
  return line.replace(COMMENT_REGEXP, '')
}

const LINE_TOKENS_REGEXP = /\s+/g

function redirectMatch(line) {
  let [origin, ...parts] = trimComment(line).trim().split(LINE_TOKENS_REGEXP)

  const redirect = FULL_URL_MATCHER.test(origin) ? parseFullOrigin(origin) : { path: origin }
  if (redirect == null || parts.length === 0) {
    return null
  }

  if (splatForwardRule(redirect, parts[0])) {
    redirect.to = redirect.path.replace(/\/\*$/, '/:splat')
  } else {
    const newHostRuleIdx = parts.findIndex((el) => el.match(/^\//) || el.match(FULL_URL_MATCHER))
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
    return { ...redirect, force: false }
  }

  const part = parts.shift()
  if (part == null) {
    redirect.force = false
  } else {
    redirect.status = Number.parseInt(part, 10)
    redirect.force = part.endsWith('!')
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

function trimLine(line) {
  return line.trim()
}

function parseRedirect(result, line, idx) {
  if (line === '' || line.startsWith('#')) {
    return result
  }

  const redirect = redirectMatch(line)
  if (!redirect) {
    return addError(result, { lineNum: idx + 1, line })
  }

  if (isInvalidSource(redirect)) {
    return addError(result, {
      lineNum: idx + 1,
      line,
      reason: 'Invalid /.netlify path in redirect source',
    })
  }

  return addSuccess(result, { ...redirect, proxy: isProxy(redirect) })
}

async function parse(filePath) {
  const text = await readFileAsync(filePath, 'utf-8')
  return text.split('\n').map(trimLine).reduce(parseRedirect, { success: [], errors: [] })
}

exports.parse = parse
