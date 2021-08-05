const test = require('ava')
const { each } = require('test-each')

const { parseConfigRedirects, normalizeRedirects } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName, opts) {
  const redirects = await parseConfigRedirects(`${FIXTURES_DIR}/netlify_config/${fixtureName}.toml`)
  return normalizeRedirects(redirects, opts)
}

each(
  [
    {
      title: 'empty',
      output: [],
    },
    {
      title: 'non_existing',
      output: [],
    },
    {
      title: 'backward_compat_origin',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
        },
      ],
    },
    {
      title: 'backward_compat_destination',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
        },
      ],
    },
    {
      title: 'backward_compat_params',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          query: { path: ':path' },
        },
      ],
    },
    {
      title: 'backward_compat_parameters',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          query: { path: ':path' },
        },
      ],
    },
    {
      title: 'backward_compat_sign',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          signed: 'api_key',
        },
      ],
    },
    {
      title: 'backward_compat_signing',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          signed: 'api_key',
        },
      ],
    },
    {
      title: 'from_simple',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
        },
      ],
    },
    {
      title: 'from_url',
      output: [
        {
          from: 'http://www.example.com/old-path',
          scheme: 'http',
          host: 'www.example.com',
          path: '/old-path',
          to: 'http://www.example.com/new-path',
        },
      ],
    },
    {
      title: 'from_forward',
      output: [
        {
          from: '/old-path/*',
          path: '/old-path/*',
          to: '/old-path/:splat',
          status: 200,
        },
      ],
    },
    {
      title: 'from_no_slash',
      output: [
        {
          from: 'old-path',
          path: 'old-path',
          to: 'new-path',
        },
      ],
    },
    {
      title: 'query',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          query: { path: ':path' },
        },
      ],
    },
    {
      title: 'conditions_country_case',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          conditions: { country: ['US'] },
        },
      ],
    },
    {
      title: 'conditions_language_case',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          conditions: { language: ['en'] },
        },
      ],
    },
    {
      title: 'conditions_role_case',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          conditions: { role: ['admin'] },
        },
      ],
    },
    {
      title: 'signed',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          signed: 'api_key',
        },
      ],
    },
    {
      title: 'complex',
      output: [
        {
          from: '/old-path',
          path: '/old-path',
          to: '/new-path',
          status: 301,
          query: {
            path: ':path',
          },
          conditions: {
            country: ['US'],
            language: ['en'],
            role: ['admin'],
          },
        },
        {
          from: '/search',
          path: '/search',
          to: 'https://api.mysearch.com',
          status: 200,
          proxy: true,
          force: true,
          signed: 'API_SIGNATURE_TOKEN',
          headers: {
            'X-From': 'Netlify',
          },
        },
      ],
    },
    {
      title: 'minimal',
      output: [
        {
          from: '/here',
          to: '/there',
          status: 200,
          force: true,
          signed: 'API_SIGNATURE_TOKEN',
          headers: {
            'X-From': 'Netlify',
          },
          query: {
            path: ':path',
          },
          conditions: {
            country: ['US'],
            language: ['en'],
            role: ['admin'],
          },
        },
      ],
      opts: { minimal: true },
    },
  ],
  ({ title }, { fixtureName = title, output, opts }) => {
    test(`Parses netlify.toml redirects | ${title}`, async (t) => {
      t.deepEqual(
        await parseRedirects(fixtureName, opts),
        // eslint-disable-next-line max-nested-callbacks
        output.map((redirect) => normalizeRedirect(redirect, opts)),
      )
    })
  },
)

each(
  [
    { title: 'invalid_toml', errorMessage: /parse configuration file/ },
    { title: 'invalid_type', errorMessage: /must be an array/ },
    { title: 'invalid_object', errorMessage: /must be objects/ },
    { title: 'invalid_no_from', errorMessage: /Missing "from"/ },
    { title: 'invalid_no_to', errorMessage: /Missing "to"/ },
    { title: 'invalid_forward_status', errorMessage: /Missing "to"/ },
    { title: 'invalid_url', errorMessage: /Invalid URL/ },
    { title: 'invalid_dot_netlify_url', errorMessage: /must not start/ },
    { title: 'invalid_dot_netlify_path', errorMessage: /must not start/ },
    { title: 'invalid_headers', errorMessage: /must be an object/ },
  ],
  ({ title }, { fixtureName = title, errorMessage }) => {
    test(`Validate syntax errors | ${title}`, async (t) => {
      await t.throwsAsync(parseRedirects(fixtureName), errorMessage)
    })
  },
)
