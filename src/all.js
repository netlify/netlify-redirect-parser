const { parseFileRedirects } = require('./line_parser')
const { mergeRedirects } = require('./merge')
const { parseConfigRedirects } = require('./netlify_config_parser')
const { normalizeRedirects } = require('./normalize')

// Parse all redirects from `netlify.toml` and `_redirects` file, then normalize
// and validate those.
const parseAllRedirects = async function ({ redirectsFiles = [], netlifyConfigPath, ...opts } = {}) {
  const [fileRedirects, configRedirects] = await Promise.all([
    getFileRedirects(redirectsFiles),
    getConfigRedirects(netlifyConfigPath),
  ])
  const normalizedFileRedirects = normalizeRedirects(fileRedirects, opts)
  const normalizedConfigRedirects = normalizeRedirects(configRedirects, opts)
  return mergeRedirects({ fileRedirects: normalizedFileRedirects, configRedirects: normalizedConfigRedirects })
}

const getFileRedirects = async function (redirectsFiles) {
  const fileRedirects = await Promise.all(redirectsFiles.map(parseFileRedirects))
  // eslint-disable-next-line unicorn/prefer-spread
  return [].concat(...fileRedirects)
}

const getConfigRedirects = async function (netlifyConfigPath) {
  if (netlifyConfigPath === undefined) {
    return []
  }

  return await parseConfigRedirects(netlifyConfigPath)
}

module.exports = { parseAllRedirects }
