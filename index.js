const lineParser = require('./line-parser')
const tomlParser = require('./toml-parser')
const yamlParser = require('./yaml-parser')

exports.parseRedirectsFormat = lineParser.parse
exports.parseTomlFormat = tomlParser.parse
exports.parseYamlFormat = yamlParser.parse
