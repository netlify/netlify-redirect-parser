const fs = require('fs')
const { promisify } = require('util')

const { isUrl, parseFrom, isSplatRule, replaceSplatRule, finalizeRedirect } = require('./common')

const readFileAsync = promisify(fs.readFile)

const parseRedirectsFormat = async function (filePath) {
  const text = await readFileAsync(filePath, 'utf-8')
  return text.split('\n').map(normalizeLine).filter(hasRedirect).map(parseRedirect).map(finalizeRedirect)
}

const normalizeLine = function (line, index) {
  return { line: line.trim(), index }
}

const hasRedirect = function ({ line }) {
  return line !== '' && !line.startsWith('#')
}

const parseRedirect = function ({ line, index }) {
  try {
    return redirectMatch(line)
  } catch (error) {
    throw new Error(`Could not parse redirect line ${index + 1}:
  ${line}
${error.message}`)
  }
}

const redirectMatch = function (line) {
  const [from, ...parts] = trimComment(line.split(LINE_TOKENS_REGEXP))

  const { scheme, host, path } = parseFrom(from)

  if (parts.length === 0) {
    throw new Error('Missing destination path/URL')
  }

  if (splatForwardRule(path, parts[0])) {
    const to = replaceSplatRule(path)
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

const trimComment = function (parts) {
  const commentIndex = parts.findIndex(isComment)
  return commentIndex === -1 ? parts : parts.slice(0, commentIndex)
}

const isComment = function (part) {
  return part.startsWith('#')
}

const LINE_TOKENS_REGEXP = /\s+/g

const splatForwardRule = function (path, statusPart) {
  const { status } = parseStatus(statusPart)
  return isSplatRule(path, status)
}

const parseLastParts = function ([statusPart, ...lastParts]) {
  const { status, force } = parseStatus(statusPart)
  const { Sign, signed = Sign, ...conditions } = parsePairs(lastParts)
  return { status, force, conditions, signed }
}

const parseStatus = function (statusPart) {
  if (statusPart === undefined) {
    return { force: false }
  }

  const status = Number.parseInt(statusPart)
  const force = statusPart.endsWith('!')
  return { status, force }
}

const parsePairs = function (conditions) {
  return Object.assign({}, ...conditions.map(parsePair))
}

const parsePair = function (condition) {
  const [key, value] = condition.split('=')
  return { [key]: value }
}

const isNewHostPart = function (part) {
  return part.startsWith('/') || isUrl(part)
}

module.exports = { parseRedirectsFormat }
