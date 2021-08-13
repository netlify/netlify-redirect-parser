const test = require('ava')
const { each } = require('test-each')

const { parseAllRedirects } = require('..')

const { FIXTURES_DIR } = require('./helpers/main')

const parseRedirects = async function ({ fileFixtureNames, configFixtureName, configRedirects, opts }) {
  const redirectsFiles =
    fileFixtureNames === undefined
      ? undefined
      : fileFixtureNames.map((fileFixtureName) => `${FIXTURES_DIR}/redirects_file/${fileFixtureName}`)
  const netlifyConfigPath =
    configFixtureName === undefined ? undefined : `${FIXTURES_DIR}/netlify_config/${configFixtureName}.toml`
  return await parseAllRedirects({ redirectsFiles, netlifyConfigPath, configRedirects, ...opts })
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
          from: '/old-path',
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
          from: '/home',
          path: '/home',
          query: {},
          to: '/',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
        {
          from: 'http://hello.bitballoon.com/*',
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
          from: '/home',
          path: '/home',
          query: {},
          to: '/',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
        {
          from: 'http://hello.bitballoon.com/*',
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
          from: '/old-path',
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
      title: 'config_redirects',
      configFixtureName: 'from_simple',
      configRedirects: [
        {
          from: '/home',
          to: '/',
        },
      ],
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          query: {},
          to: '/new-path',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
        {
          from: '/home',
          path: '/home',
          query: {},
          to: '/',
          force: false,
          conditions: {},
          headers: {},
          proxy: false,
        },
      ],
    },
    {
      title: 'minimal',
      fileFixtureNames: ['from_simple', 'from_absolute_uri'],
      configFixtureName: 'from_simple',
      output: [
        {
          from: '/home',
          query: {},
          to: '/',
          force: false,
          conditions: {},
          headers: {},
        },
        {
          from: 'http://hello.bitballoon.com/*',
          query: {},
          to: 'http://www.hello.com/:splat',
          force: false,
          conditions: {},
          headers: {},
        },
        {
          from: '/old-path',
          query: {},
          to: '/new-path',
          force: false,
          conditions: {},
          headers: {},
        },
      ],
      opts: { minimal: true },
    },
  ],
  ({ title }, { fileFixtureNames, configFixtureName, configRedirects, output, opts }) => {
    test(`Parses netlify.toml and _redirects | ${title}`, async (t) => {
      const { redirects, errors } = await parseRedirects({ fileFixtureNames, configFixtureName, configRedirects, opts })
      t.is(errors.length, 0)
      t.deepEqual(redirects, output)
    })
  },
)
