const fs = require('fs')
const { promisify } = require('util')

const { isUrl, isSplatRule, replaceSplatRule, finalizeRedirect } = require('./common')

const readFileAsync = promisify(fs.readFile)

const parseRedirectsFormat = async function (filePath) {
  const text = await readFileAsync(filePath, 'utf-8')
  return text.split('\n').map(normalizeLine).filter(hasRedirect).map(parseRedirect).map(finalizeRedirect)
}

const normalizeLine = function (line, index) {
  return { line: line.trim(), index }
}

const hasRedirect = function ({ line }) {
  return line !== '' && !isComment(line)
}

const parseRedirect = function ({ line, index }) {
  try {
    return parseRedirectLine(line)
  } catch (error) {
    throw new Error(`Could not parse redirect line ${index + 1}:
  ${line}
${error.message}`)
  }
}

const parseRedirectLine = function (line) {
  const [from, ...parts] = trimComment(line.split(LINE_TOKENS_REGEXP))

  if (parts.length === 0) {
    throw new Error('Missing destination path/URL')
  }

  const newParts = addForwardRule(from, parts)
  const toIndex = newParts.findIndex(isToPart)
  if (toIndex === -1) {
    throw new Error('Missing destination path/URL')
  }

  const query = parsePairs(newParts.slice(0, toIndex))
  const to = newParts[toIndex]
  const { status, force } = parseStatus(newParts[toIndex + 1])
  const { Sign, signed = Sign, ...conditions } = parsePairs(newParts.slice(toIndex + 2))
  return { from, query, to, status, force, conditions, signed, headers: {} }
}

const trimComment = function (parts) {
  const commentIndex = parts.findIndex(isComment)
  return commentIndex === -1 ? parts : parts.slice(0, commentIndex)
}

const isComment = function (part) {
  return part.startsWith('#')
}

const LINE_TOKENS_REGEXP = /\s+/g

const addForwardRule = function (from, parts) {
  const status = getStatusCode(parts[0])
  return isSplatRule(from, status) ? [replaceSplatRule(from), ...parts] : parts
}

const isToPart = function (part) {
  return part.startsWith('/') || isUrl(part)
}

const parseStatus = function (statusPart) {
  if (statusPart === undefined) {
    return { force: false }
  }

  const status = getStatusCode(statusPart)
  const force = statusPart.endsWith('!')
  return { status, force }
}

const getStatusCode = function (statusPart) {
  return Number.parseInt(statusPart)
}

const parsePairs = function (conditions) {
  return Object.assign({}, ...conditions.map(parsePair))
}

const parsePair = function (condition) {
  const [key, value] = condition.split('=')
  return { [key]: value }
}

module.exports = { parseRedirectsFormat }
