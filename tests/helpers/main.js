const FIXTURES_DIR = `${__dirname}/../fixtures`

// Assign default values to redirects
const normalizeRedirect = function (redirect, { minimal } = {}) {
  return {
    ...(!minimal && ADDED_DEFAULT_REDIRECTS),
    ...DEFAULT_REDIRECT,
    ...redirect,
  }
}

const ADDED_DEFAULT_REDIRECTS = {
  proxy: false,
}

const DEFAULT_REDIRECT = {
  force: false,
  query: {},
  conditions: {},
  headers: {},
}

module.exports = { FIXTURES_DIR, normalizeRedirect }
