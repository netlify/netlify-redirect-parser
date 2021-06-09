const { parseRedirectsFormat } = require('./line_parser')
const { mergeRedirects } = require('./merge')
const { parseNetlifyConfig } = require('./netlify_config_parser')

module.exports = { parseRedirectsFormat, parseNetlifyConfig, mergeRedirects }
