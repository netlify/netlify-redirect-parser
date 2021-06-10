const { parseFileRedirects } = require('./line_parser')
const { mergeRedirects } = require('./merge')
const { parseConfigRedirects } = require('./netlify_config_parser')
const { normalizeRedirects } = require('./normalize')

module.exports = { parseFileRedirects, parseConfigRedirects, mergeRedirects, normalizeRedirects }
