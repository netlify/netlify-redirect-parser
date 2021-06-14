const test = require('ava')
const { each } = require('test-each')

const { parseConfigRedirects, normalizeRedirects } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName) {
  const redirects = await parseConfigRedirects(`${FIXTURES_DIR}/netlify_config/${fixtureName}.toml`)
  return normalizeRedirects(redirects)
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
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
        },
      ],
    },
    {
      title: 'backward_compat_destination',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
        },
      ],
    },
    {
      title: 'backward_compat_params',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
          parameters: { path: ':path' },
        },
      ],
    },
    {
      title: 'backward_compat_parameters',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
          parameters: { path: ':path' },
        },
      ],
    },
    {
      title: 'backward_compat_sign',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
          signed: 'api_key',
        },
      ],
    },
    {
      title: 'backward_compat_signing',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
          signed: 'api_key',
        },
      ],
    },
    {
      title: 'from_simple',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
        },
      ],
    },
    {
      title: 'from_url',
      output: [
        {
          origin: 'http://www.example.com/old-path',
          scheme: 'http',
          host: 'www.example.com',
          path: '/old-path',
          destination: 'http://www.example.com/new-path',
        },
      ],
    },
    {
      title: 'from_forward',
      output: [
        {
          origin: '/old-path/*',
          path: '/old-path/*',
          destination: '/old-path/:splat',
          status: 200,
        },
      ],
    },
    {
      title: 'from_no_slash',
      output: [
        {
          origin: 'old-path',
          path: 'old-path',
          destination: 'new-path',
        },
      ],
    },
    {
      title: 'query',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
          parameters: { path: ':path' },
        },
      ],
    },
    {
      title: 'signed',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
          signed: 'api_key',
        },
      ],
    },
    {
      title: 'complex',
      output: [
        {
          origin: '/old-path',
          path: '/old-path',
          destination: '/new-path',
          status: 301,
          parameters: {
            path: ':path',
          },
          conditions: {
            Country: ['US'],
            Language: ['en'],
            Role: ['admin'],
          },
        },
        {
          origin: '/search',
          path: '/search',
          destination: 'https://api.mysearch.com',
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
  ],
  ({ title }, { fixtureName = title, output }) => {
    test(`Parses netlify.toml redirects | ${title}`, async (t) => {
      t.deepEqual(await parseRedirects(fixtureName), output.map(normalizeRedirect))
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
