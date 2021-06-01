const FIXTURES_DIR = `${__dirname}/../fixtures`

// Assign default values to redirects
const normalizeRedirect = function (redirect) {
  return { ...DEFAULT_REDIRECT, ...redirect }
}

const DEFAULT_REDIRECT = {
  proxy: false,
  force: false,
  query: {},
  conditions: {},
  headers: {},
  edgeHandlers: [],
}

module.exports = { FIXTURES_DIR, normalizeRedirect }
