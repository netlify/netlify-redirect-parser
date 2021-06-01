const fs = require('fs')
const { promisify } = require('util')

const { isInvalidSource, isProxy, isUrl, parseFrom, isSplatRule, removeUndefinedValues } = require('./common')

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

function isComment(part) {
  return part.startsWith('#')
}

function trimComment(parts) {
  const commentIndex = parts.findIndex(isComment)
  return commentIndex === -1 ? parts : parts.slice(0, commentIndex)
}

const LINE_TOKENS_REGEXP = /\s+/g

function isNewHostPart(part) {
  return part.startsWith('/') || isUrl(part)
}

function parseStatus(statusPart) {
  if (statusPart === undefined) {
    return { force: false }
  }

  const status = Number.parseInt(statusPart)
  const force = statusPart.endsWith('!')
  return { status, force }
}

function parseLastParts([statusPart, ...lastParts]) {
  const { status, force } = parseStatus(statusPart)
  const { Sign, signed = Sign, ...conditions } = parsePairs(lastParts)
  return { status, force, conditions, signed }
}

function redirectMatch(line) {
  const [from, ...parts] = trimComment(line.split(LINE_TOKENS_REGEXP))
  if (parts.length === 0) {
    throw new Error('Missing source or destination path/URL')
  }

  const { scheme, host, path } = parseFrom(from)

  if (isInvalidSource(path)) {
    throw new Error('"path" field must not start with "/.netlify"')
  }

  if (splatForwardRule(path, parts[0])) {
    const to = path.replace(/\/\*$/, '/:splat')
    const { status, force, conditions, signed } = parseLastParts(parts)
    return { to, scheme, host, path, status, force, query: {}, conditions, headers: {}, edgeHandlers: [], signed }
  }

  const newHostPartIndex = parts.findIndex(isNewHostPart)
  if (newHostPartIndex === -1) {
    throw new Error('Missing destination path/URL')
  }

  const query = parsePairs(parts.slice(0, newHostPartIndex))
  const to = parts[newHostPartIndex]
  const { status, force, conditions, signed } = parseLastParts(parts.slice(newHostPartIndex + 1))
  return { to, scheme, host, path, status, force, query, conditions, headers: {}, edgeHandlers: [], signed }
}

function hasRedirect({ line }) {
  return line !== '' && !line.startsWith('#')
}

function normalizeLine(line, index) {
  return { line: line.trim(), index }
}

function parseRedirect({ line, index }) {
  try {
    const redirect = redirectMatch(line)
    return removeUndefinedValues({ ...redirect, proxy: isProxy(redirect) })
  } catch (error) {
    throw new Error(`Could not parse redirect line ${index + 1}:
  ${line}
${error.message}`)
  }
}

async function parseRedirectsFormat(filePath) {
  const text = await readFileAsync(filePath, 'utf-8')
  return text.split('\n').map(normalizeLine).filter(hasRedirect).map(parseRedirect)
}

module.exports = { parseRedirectsFormat }
