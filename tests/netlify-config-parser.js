const test = require('ava')

const { parseNetlifyConfig } = require('..')

const FIXTURES_DIR = `${__dirname}/fixtures`

const DEFAULT_REDIRECT = {
  proxy: false,
  force: false,
  query: {},
  conditions: {},
  headers: {},
  edgeHandlers: [],
}

const parseRedirects = async function (fixtureName) {
  return await parseNetlifyConfig(`${FIXTURES_DIR}/${fixtureName}`)
}

test('netlify.toml redirects parsing', async (t) => {
  const redirects = await parseRedirects('netlify.toml')
  t.deepEqual(redirects, [
    {
      ...DEFAULT_REDIRECT,
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
      ...DEFAULT_REDIRECT,
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
  ])
})
