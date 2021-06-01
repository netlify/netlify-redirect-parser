const path = require('path')

const test = require('ava')

const { parseNetlifyConfig } = require('.')

const testFilesDir = path.resolve('__dirname', '../', 'test-files')

test('netlify.toml redirects parsing', async (t) => {
  const result = await parseNetlifyConfig(path.resolve(testFilesDir, 'netlify.toml'))
  t.deepEqual(result.success, [
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
