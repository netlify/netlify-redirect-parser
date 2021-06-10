const { readFile } = require('fs')
const { promisify } = require('util')

const pathExists = require('path-exists')
const { parse: loadToml } = require('toml')

const pReadFile = promisify(readFile)

// Parse `redirects` field in "netlify.toml" to an array of objects.
// This field is already an array of objects so it only validates and
// normalizes it.
const parseConfigRedirects = async function (netlifyConfigPath) {
  if (!(await pathExists(netlifyConfigPath))) {
    return []
  }

  const { redirects = [] } = await parseConfig(netlifyConfigPath)
  return redirects
}

// Load the configuration file and parse it (TOML)
const parseConfig = async function (configPath) {
  try {
    const configString = await pReadFile(configPath, 'utf8')
    const config = loadToml(configString)
    // Convert `null` prototype objects to normal plain objects
    return JSON.parse(JSON.stringify(config))
  } catch (error) {
    throw new Error(`Could not parse configuration file: ${error}`)
  }
}

module.exports = { parseConfigRedirects }
