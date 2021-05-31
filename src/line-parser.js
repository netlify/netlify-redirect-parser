const fs = require('fs')
const { promisify } = require('util')

const {
  addSuccess,
  addError,
  isInvalidSource,
  isProxy,
  FULL_URL_MATCHER,
  parseFrom,
  removeUndefinedValues,
} = require('./common')

const readFileAsync = promisify(fs.readFile)

const FORWARD_STATUS_MATCHER = /^2\d\d!?$/

function splatForwardRule(path, statusPart) {
  return path.endsWith('/*') && FORWARD_STATUS_MATCHER.test(statusPart)
}

function splitCondition(condition) {
  const [key, value] = condition.split('=')
  return { [key]: value }
}

function parseConditions(conditions) {
  return Object.assign({}, ...conditions.map(splitCondition))
}

const COMMENT_REGEXP = /(^|\s)#.*/u

function trimComment(line) {
  return line.replace(COMMENT_REGEXP, '')
}

const LINE_TOKENS_REGEXP = /\s+/g

function isPathOrUrl(part) {
  return part.startsWith('/') || FULL_URL_MATCHER.test(part)
}

function redirectMatch(line) {
  let [from, ...parts] = trimComment(line).trim().split(LINE_TOKENS_REGEXP)
  if (parts.length === 0) {
    return null
  }

  const { scheme, host, path } = parseFrom(from)
  if (path === undefined) {
    return null
  }

  const redirect = {}
  if (splatForwardRule(path, parts[0])) {
    redirect.to = path.replace(/\/\*$/, '/:splat')
  } else {
    const newHostRuleIdx = parts.findIndex(isPathOrUrl)
    if (newHostRuleIdx < 0) {
      return null
    }

    redirect.to = parts[newHostRuleIdx]
    if (newHostRuleIdx > 0) {
      redirect.params = parseConditions(parts.slice(0, newHostRuleIdx))
    }

    // remove parsed parts for params and host
    parts = parts.slice(newHostRuleIdx + 1)
  }

  const [statusPart, ...lastParts] = parts

  if (statusPart === undefined) {
    return removeUndefinedValues({ ...redirect, scheme, host, path, force: false, signed: false, conditions: {} })
  }

  const status = Number.parseInt(statusPart, 10)
  const force = statusPart.endsWith('!')
  const { Sign = false, signed = Sign, ...conditions } = parseConditions(lastParts)

  return removeUndefinedValues({ ...redirect, scheme, host, path, status, force, signed, conditions })
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
