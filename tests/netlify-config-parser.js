const test = require('ava')

const { parseNetlifyConfig } = require('..')

const FIXTURES_DIR = `${__dirname}/fixtures`

const parseRedirects = async function (fixtureName) {
  return await parseNetlifyConfig(`${FIXTURES_DIR}/${fixtureName}`)
}

test('netlify.toml redirects parsing', async (t) => {
  const redirects = await parseRedirects('netlify.toml')
  t.deepEqual(redirects, [
    {
      path: '/old-path',
      to: '/new-path',
      status: 301,
      proxy: false,
      force: false,
      query: {
        path: ':path',
      },
      conditions: {
        Country: ['US'],
        Language: ['en'],
        Role: ['admin'],
      },
      headers: {},
      edgeHandlers: [],
    },
    {
      path: '/search',
      to: 'https://api.mysearch.com',
      status: 200,
      proxy: true,
      force: true,
      signed: 'API_SIGNATURE_TOKEN',
      query: {},
      conditions: {},
      headers: {
        'X-From': 'Netlify',
      },
      edgeHandlers: [],
    },
  ])
})
