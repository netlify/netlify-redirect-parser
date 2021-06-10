const test = require('ava')
const { each } = require('test-each')

const { parseAllRedirects } = require('..')

const { FIXTURES_DIR } = require('./helpers/main')

const parseRedirects = async function ({ fileFixtureNames, configFixtureName }) {
  const redirectsFiles =
    fileFixtureNames === undefined
      ? undefined
      : fileFixtureNames.map((fileFixtureName) => `${FIXTURES_DIR}/redirects_file/${fileFixtureName}`)
  const netlifyConfigPath =
    configFixtureName === undefined ? undefined : `${FIXTURES_DIR}/netlify_config/${configFixtureName}.toml`
  const options =
    redirectsFiles === undefined && netlifyConfigPath === undefined ? undefined : { redirectsFiles, netlifyConfigPath }
  return await parseAllRedirects(options)
}

each(
  [
    {
      title: 'empty',
      output: [],
    },
    {
      title: 'only_config',
      configFixtureName: 'from_simple',
      output: [
        {
          path: '/old-path',
          query: {},
          to: '/new-path',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
      ],
    },
    {
      title: 'only_files',
      fileFixtureNames: ['from_simple', 'from_absolute_uri'],
      output: [
        {
          path: '/home',
          query: {},
          to: '/',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
        {
          scheme: 'http',
          host: 'hello.bitballoon.com',
          path: '/*',
          query: {},
          to: 'http://www.hello.com/:splat',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
      ],
    },
    {
      title: 'both_config_files',
      fileFixtureNames: ['from_simple', 'from_absolute_uri'],
      configFixtureName: 'from_simple',
      output: [
        {
          path: '/home',
          query: {},
          to: '/',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
        {
          scheme: 'http',
          host: 'hello.bitballoon.com',
          path: '/*',
          query: {},
          to: 'http://www.hello.com/:splat',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
        {
          path: '/old-path',
          query: {},
          to: '/new-path',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
      ],
    },
  ],
  ({ title }, { fileFixtureNames, configFixtureName, output }) => {
    test(`Parses netlify.toml and _redirects | ${title}`, async (t) => {
      t.deepEqual(await parseRedirects({ fileFixtureNames, configFixtureName }), output)
    })
  },
)
