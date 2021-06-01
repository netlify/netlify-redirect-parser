const fs = require('fs')
const { promisify } = require('util')

const {
  addSuccess,
  addError,
  isInvalidSource,
  isProxy,
  FULL_URL_MATCHER,
  parseFrom,
  isSplatRule,
  removeUndefinedValues,
} = require('./common')

const readFileAsync = promisify(fs.readFile)

function splatForwardRule(path, statusPart) {
  const { status } = parseStatus(statusPart)
  return isSplatRule(path, status)
}

function parsePair(condition) {
  const [key, value] = condition.split('=')
  return { [key]: value }
}

function parsePairs(conditions) {
  return Object.assign({}, ...conditions.map(parsePair))
}

const COMMENT_REGEXP = /(^|\s)#.*/u

function trimComment(line) {
  return line.replace(COMMENT_REGEXP, '')
}

const LINE_TOKENS_REGEXP = /\s+/g

function isNewHostPart(part) {
  return part.startsWith('/') || FULL_URL_MATCHER.test(part)
}

function parseStatus(statusPart) {
  if (statusPart === undefined) {
    return { force: false }
  }

  const status = Number.parseInt(statusPart, 10)
  const force = statusPart.endsWith('!')
  return { status, force }
}

function parseLastParts([statusPart, ...lastParts]) {
  const { status, force } = parseStatus(statusPart)
  const { Sign, signed = Sign, ...conditions } = parsePairs(lastParts)
  return { status, force, conditions, signed }
}

function redirectMatch(line) {
  const [from, ...parts] = trimComment(line).trim().split(LINE_TOKENS_REGEXP)
  if (parts.length === 0) {
    return null
  }

  const { scheme, host, path } = parseFrom(from)
  if (path === undefined) {
    return null
  }

  if (splatForwardRule(path, parts[0])) {
    const to = path.replace(/\/\*$/, '/:splat')
    const { status, force, conditions, signed } = parseLastParts(parts)
    return removeUndefinedValues({ to, scheme, host, path, status, force, params: {}, conditions, signed })
  }

  const newHostPartIndex = parts.findIndex(isNewHostPart)
  if (newHostPartIndex === -1) {
    return null
  }

  const params = parsePairs(parts.slice(0, newHostPartIndex))
  const to = parts[newHostPartIndex]
  const { status, force, conditions, signed } = parseLastParts(parts.slice(newHostPartIndex + 1))
  return removeUndefinedValues({ to, scheme, host, path, status, force, params, conditions, signed })
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

  if (isInvalidSource(redirect.path)) {
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
