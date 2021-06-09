const test = require('ava')
const { each } = require('test-each')

const { parseNetlifyConfig } = require('..')

const { FIXTURES_DIR, normalizeRedirect } = require('./helpers/main')

const parseRedirects = async function (fixtureName) {
  return await parseNetlifyConfig(`${FIXTURES_DIR}/netlify_config/${fixtureName}.toml`)
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
      output: [{ path: '/old-path', to: '/new-path' }],
    },
    {
      title: 'backward_compat_destination',
      output: [{ path: '/old-path', to: '/new-path' }],
    },
    {
      title: 'backward_compat_params',
      output: [{ path: '/old-path', to: '/new-path', query: { path: ':path' } }],
    },
    {
      title: 'backward_compat_parameters',
      output: [{ path: '/old-path', to: '/new-path', query: { path: ':path' } }],
    },
    {
      title: 'backward_compat_sign',
      output: [{ path: '/old-path', to: '/new-path', signed: 'api_key' }],
    },
    {
      title: 'backward_compat_signing',
      output: [{ path: '/old-path', to: '/new-path', signed: 'api_key' }],
    },
    {
      title: 'from_simple',
      output: [{ path: '/old-path', to: '/new-path' }],
    },
    {
      title: 'from_url',
      output: [{ scheme: 'http', host: 'www.example.com', path: '/old-path', to: 'http://www.example.com/new-path' }],
    },
    {
      title: 'from_forward',
      output: [{ path: '/old-path/*', to: '/old-path/:splat', status: 200 }],
    },
    {
      title: 'query',
      output: [{ path: '/old-path', to: '/new-path', query: { path: ':path' } }],
    },
    {
      title: 'signed',
      output: [{ path: '/old-path', to: '/new-path', signed: 'api_key' }],
    },
    {
      title: 'complex',
      output: [
        {
          path: '/old-path',
          to: '/new-path',
          status: 301,
          query: {
            path: ':path',
          },
          conditions: {
            Country: ['US'],
            Language: ['en'],
            Role: ['admin'],
          },
        },
        {
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
