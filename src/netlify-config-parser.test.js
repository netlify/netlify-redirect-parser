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
      conditions: {
        Country: ['US'],
        Language: ['en'],
        Role: ['admin'],
      },
      params: {
        path: ':path',
      },
    },
    {
      path: '/search',
      to: 'https://api.mysearch.com',
      status: 200,
      proxy: true,
      force: true,
      params: {},
      conditions: {},
      signed: 'API_SIGNATURE_TOKEN',
      headers: {
        'X-From': 'Netlify',
      },
    },
  ])
})
